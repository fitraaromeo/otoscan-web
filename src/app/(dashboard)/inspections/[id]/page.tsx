'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Cpu,
  Camera,
  RefreshCw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { InspectionStatusBadge, DamageTypeBadge, SeverityBadge } from '@/app/_components/Badge';
import { mockInspections } from '@/app/_lib/mock-data';
import type { AngleCapture, Inspection } from '@/app/_lib/types';
import { fetchInspectionByIDApi, uploadInspectionPhotoApi, formatErrorMessage, formatDateTime } from '@/app/_lib/api';

const ANGLE_LABEL: Record<string, string> = {
  front: '🔵 Front',
  rear: '🔴 Rear',
  left: '🟡 Left',
  right: '🟢 Right',
};

function AnglePlaceholder({ angle }: { angle: string }) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '4/3',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
        border: '1px dashed rgba(99,102,241,0.25)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: 'var(--text-3)',
      }}
    >
      <Camera size={28} style={{ opacity: 0.4 }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>{ANGLE_LABEL[angle]}</div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>No photo uploaded</div>
    </div>
  );
}

function AnnotatedImage({ capture }: { capture: AngleCapture }) {
  const hasDamages = capture.damages.length > 0;
  const displayUrl = capture.resultUrl || capture.imageUrl;

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
      {displayUrl ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#000' }}>
          <img
            src={displayUrl}
            alt={ANGLE_LABEL[capture.angle]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '4/3',
            background: `linear-gradient(135deg, #1a2a47 0%, #0f1629 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ opacity: 0.15, fontSize: 64 }}>🚗</div>
          {hasDamages &&
            capture.damages.map((d) => {
              const colors: Record<string, string> = {
                scratch: '#f59e0b',
                dent: '#6366f1',
                crack: '#ef4444',
                glass_shatter: '#8b5cf6',
                lamp_broken: '#f97316',
                tire_flat: '#06b6d4',
              };
              const color = colors[d.type] ?? '#6366f1';
              const pct = {
                left: `${(d.x / 300) * 100}%`,
                top: `${(d.y / 225) * 100}%`,
                width: `${(d.width / 300) * 100}%`,
                height: `${(d.height / 225) * 100}%`,
              };

              return (
                <div
                  key={d.id}
                  style={{
                    position: 'absolute',
                    left: pct.left,
                    top: pct.top,
                    width: pct.width,
                    height: pct.height,
                    border: `2px solid ${color}`,
                    borderRadius: 3,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -20,
                      left: 0,
                      background: color,
                      color: '#fff',
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 3,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}
                  >
                    {d.type} {Math.round(d.confidence * 100)}%
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Angle label overlay */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          fontSize: 11,
          padding: '3px 10px',
          borderRadius: 5,
          fontWeight: 600,
        }}
      >
        {ANGLE_LABEL[capture.angle]}
      </div>

      {/* Damage count badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: hasDamages ? 'var(--danger)' : 'var(--success)',
          color: '#fff',
          fontSize: 11,
          padding: '3px 10px',
          borderRadius: 5,
          fontWeight: 600,
        }}
      >
        {hasDamages ? `${capture.damages.length} kerusakan` : '✓ Bersih'}
      </div>
    </div>
  );
}

function AngleCardSlot({
  capture,
  inspectionId,
  onPhotoUploaded,
}: {
  capture: AngleCapture;
  inspectionId: string;
  onPhotoUploaded: (updated: Inspection) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayCapture: AngleCapture = localPreview
    ? { ...capture, resultUrl: localPreview, imageUrl: localPreview }
    : capture;

  const hasPhoto = Boolean(displayCapture.imageUrl || displayCapture.resultUrl || displayCapture.damages.length > 0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    setUploading(true);
    setUploadError(null);
    try {
      const updated = await uploadInspectionPhotoApi(inspectionId, file, capture.angle);
      if (updated) {
        setLocalPreview(null);
        onPhotoUploaded(updated);
      }
    } catch (err: any) {
      setUploadError(formatErrorMessage(err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Image container / loading overlay */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
        {hasPhoto ? (
          <AnnotatedImage capture={displayCapture} />
        ) : (
          <AnglePlaceholder angle={capture.angle} />
        )}

        {uploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(7, 12, 24, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              zIndex: 10,
              color: 'var(--accent-light)',
            }}
          >
            <RefreshCw size={28} className="animate-spin" />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Memproses AI YOLOv12...</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Mendeksi kerusakan fisik</div>
          </div>
        )}
      </div>

      {uploadError && (
        <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '6px 10px', borderRadius: 6 }}>
          ⚠️ {uploadError}
        </div>
      )}

      {/* Retake / Upload Button */}
      <button
        className="btn btn-secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          width: '100%',
          justifyContent: 'center',
          gap: 8,
          fontSize: 12,
          padding: '8px 12px',
        }}
      >
        <ImageIcon size={14} style={{ color: 'var(--accent-light)' }} />
        <span>{hasPhoto ? `Retake / Ambil Ulang (${ANGLE_LABEL[capture.angle]})` : `Upload Foto Galeri (${ANGLE_LABEL[capture.angle]})`}</span>
      </button>
    </div>
  );
}

function getInspectionDuration(startedAt?: string | null, completedAt?: string | null, angles?: AngleCapture[]) {
  if (!startedAt) return '—';

  const photoTimes = (angles || [])
    .map((a) => (a.capturedAt ? new Date(a.capturedAt).getTime() : null))
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);

  let start = new Date(startedAt).getTime();
  let end = completedAt ? new Date(completedAt).getTime() : start;

  if (photoTimes.length >= 2) {
    start = photoTimes[0];
    end = photoTimes[photoTimes.length - 1];
  } else if (photoTimes.length === 1) {
    end = photoTimes[0];
  }

  const diffSec = Math.max(0, Math.round((end - start) / 1000));
  if (diffSec < 60) {
    return diffSec > 0 ? `${diffSec} detik` : '< 1 menit';
  }
  const mins = Math.round(diffSec / 60);
  return `${mins} menit`;
}

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      const fetched = await fetchInspectionByIDApi(id);
      if (fetched) {
        setInspection(fetched);
      } else {
        setInspection(mockInspections.find((i) => i.id === id) || mockInspections[0]);
      }
      setLoading(false);
    }
    loadDetail();
  }, [id]);

  if (loading || !inspection) {
    return (
      <div style={{ width: '100%', padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
        Memuat detail laporan inspeksi...
      </div>
    );
  }

  const allDamages = inspection.angles.flatMap((a) => a.damages);

  return (
    <div style={{ width: '100%' }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/inspections"
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', marginBottom: 16 }}
        >
          <ArrowLeft size={14} />
          Kembali ke Inspeksi
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <InspectionStatusBadge status={inspection.status} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                ID: {inspection.id}
              </span>
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text-1)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Inspection — {inspection.licensePlate}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {inspection.vehicleName}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Client / Owner', value: inspection.clientName, icon: <User size={13} /> },
              {
                label: 'Inspection Date',
                value: formatDateTime(inspection.createdAt || inspection.startedAt),
                icon: <Calendar size={13} />,
              },
              { label: 'Inspector Officer', value: inspection.inspectorName, icon: <User size={13} /> },
            ].map((info) => (
              <div
                key={info.label}
                className="card"
                style={{ padding: '10px 16px', minWidth: 160 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)', fontSize: 11, marginBottom: 4 }}>
                  {info.icon}
                  {info.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                  {info.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Scanned Angles',
            value: `${inspection.angles.filter((a) => a.imageUrl !== null).length}/4`,
            color: 'var(--info)',
            bg: 'var(--info-bg)',
            icon: <Camera size={18} />,
          },
          {
            label: 'Total Damages',
            value: inspection.totalDamages,
            color: inspection.totalDamages > 0 ? 'var(--danger)' : 'var(--success)',
            bg: inspection.totalDamages > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
            icon: <AlertCircle size={18} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.color,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 4-side photo grid */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Car size={18} style={{ color: 'var(--accent-light)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              4-Side Scan Results (YOLOv12 AI Detection)
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            💡 Click the upload button on each side to choose photo from gallery
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {inspection.angles.map((capture) => (
            <AngleCardSlot
              key={capture.angle}
              capture={capture}
              inspectionId={inspection.id}
              onPhotoUploaded={(updated) => setInspection(updated)}
            />
          ))}
        </div>
      </div>

      {/* Damage list */}
      {allDamages.length > 0 ? (
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Detected Damage List ({allDamages.length})
              </h3>
            </div>
          </div>

          {/* Akumulasi per Jenis Kerusakan */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', alignSelf: 'center', marginRight: 4 }}>
              Damage Summary:
            </span>
            {Object.entries(
              allDamages.reduce<Record<string, number>>((acc, d) => {
                acc[d.type] = (acc[d.type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <DamageTypeBadge type={type as any} />
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'var(--accent-light)',
                    background: 'rgba(99,102,241,0.18)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {count} items
                </span>
              </div>
            ))}
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Damage Type</th>
                <th>Vehicle Side</th>
              </tr>
            </thead>
            <tbody>
              {allDamages.map((d, i) => (
                <tr key={d.id}>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{i + 1}</td>
                  <td><DamageTypeBadge type={d.type} /></td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{ANGLE_LABEL[d.angle]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
            No Damages Detected
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            YOLOv12 AI has not detected any damage on this vehicle yet. Please upload photos for each angle.
          </div>
        </div>
      )}

      {/* Notes */}
      {inspection.notes && (
        <div className="card" style={{ padding: '20px 22px', marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', margin: '0 0 10px' }}>
            📝 Inspector Notes
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7, margin: 0 }}>
            {inspection.notes}
          </p>
        </div>
      )}
    </div>
  );
}
