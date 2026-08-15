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
import { fetchInspectionByIDApi, uploadInspectionPhotoApi, detectInspectionPhotoPreviewApi, formatErrorMessage, formatDateTime } from '@/app/_lib/api';
import Modal from '@/app/_components/Modal';

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

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

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Live AI Tracking States
  const [liveAiEnabled, setLiveAiEnabled] = useState(false);
  const [liveDamages, setLiveDamages] = useState<any[]>([]);
  const isProcessingLiveFrameRef = useRef(false);



  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayCapture: AngleCapture = localPreview
    ? { ...capture, resultUrl: localPreview, imageUrl: localPreview }
    : capture;

  const hasPhoto = Boolean(displayCapture.imageUrl || displayCapture.resultUrl || displayCapture.damages.length > 0);

  // Enumerate video devices on open, requesting permission first to ensure full labels list
  useEffect(() => {
    async function initDevices() {
      if (isCameraOpen) {
        try {
          // Request permission first
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach((track) => track.stop());

          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
          if (videoInputs.length > 0) {
            const backDev = videoInputs.find(
              (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
            );
            setSelectedDeviceId(backDev ? backDev.deviceId : videoInputs[0].deviceId);
          }
        } catch (err: any) {
          console.error("Gagal mendapatkan izin akses kamera:", err);
          setUploadError('Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses kamera pada perangkat Anda.');
        }
      }
    }
    initDevices();
  }, [isCameraOpen]);

  // Start stream when device or modal changes
  useEffect(() => {
    if (isCameraOpen && selectedDeviceId) {
      startCamera(selectedDeviceId);
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOpen, selectedDeviceId]);

  // Live AI frame capture loop using recursive timeout to call detect-preview route
  useEffect(() => {
    let isRunning = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function loop() {
      if (!isRunning) return;
      if (isCameraOpen && liveAiEnabled && stream) {
        await processLiveDetectionFrame();
      }
      if (isRunning && isCameraOpen && liveAiEnabled && stream) {
        timeoutId = setTimeout(loop, 1200); // Poll every 1.2 seconds
      }
    }

    if (isCameraOpen && liveAiEnabled && stream) {
      loop();
    } else {
      setLiveDamages([]);
    }

    return () => {
      isRunning = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isCameraOpen, liveAiEnabled, stream]);

  async function processLiveDetectionFrame() {
    if (isProcessingLiveFrameRef.current) return;
    if (!videoRef.current || !canvasRef.current) return;

    isProcessingLiveFrameRef.current = true;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 300;
      canvas.height = 225;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const file = dataURLtoFile(dataUrl, `live_${capture.angle}.jpg`);
        const res = await detectInspectionPhotoPreviewApi(file);
        if (res && res.status === 'success') {
          setLiveDamages(res.predictions);
        }
      }
    } catch (err) {
      console.warn('Live AI preview frame process failed/skipped:', err);
    } finally {
      isProcessingLiveFrameRef.current = false;
    }
  }



  async function startCamera(deviceId: string) {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: { deviceId: { exact: deviceId } },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.warn('Fallback to default camera stream constraints:', err);
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (fallbackErr: any) {
        setUploadError('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
      }
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  }

  function retakePhoto() {
    setCapturedImage(null);
    if (selectedDeviceId) {
      startCamera(selectedDeviceId);
    }
  }

  function handleCloseCamera() {
    setIsCameraOpen(false);
    stopCamera();
  }

  async function saveCapturedPhoto() {
    if (!capturedImage) return;
    setUploading(true);
    setUploadError(null);
    setIsCameraOpen(false);
    
    // Generate preview
    setLocalPreview(capturedImage);

    try {
      const file = dataURLtoFile(capturedImage, `inspection_${capture.angle}_${Date.now()}.jpg`);
      const updated = await uploadInspectionPhotoApi(inspectionId, file, capture.angle);
      if (updated) {
        setLocalPreview(null);
        onPhotoUploaded(updated);
      }
    } catch (err: any) {
      setUploadError(formatErrorMessage(err.message));
    } finally {
      setUploading(false);
      setCapturedImage(null);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const angleInstruction: Record<string, string> = {
    front: 'Posisikan bagian DEPAN mobil di dalam bingkai 🚘',
    rear: 'Posisikan bagian BELAKANG mobil di dalam bingkai 🚘',
    left: 'Posisikan bagian KIRI mobil di dalam bingkai 🚘',
    right: 'Posisikan bagian KANAN mobil di dalam bingkai 🚘',
  };

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

      {/* Action Buttons: Camera and Gallery side-by-side */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setCapturedImage(null);
            setUploadError(null);
            setLiveAiEnabled(false);
            setIsCameraOpen(true);
          }}
          disabled={uploading}
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            padding: '8px 10px',
          }}
        >
          <Camera size={14} />
          <span>Kamera</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            padding: '8px 10px',
          }}
        >
          <ImageIcon size={14} style={{ color: 'var(--accent-light)' }} />
          <span>Galeri</span>
        </button>
      </div>

      {/* Real-time Camera Modal */}
      <Modal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        title={`Scan Real-time — ${ANGLE_LABEL[capture.angle]}`}
        subtitle="Ambil foto secara langsung menggunakan kamera perangkat Anda"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {/* Device Selector & Live AI Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {videoDevices.length > 1 && !capturedImage && (
                <select
                  className="form-input"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                >
                  {videoDevices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Kamera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}

              {!capturedImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    id={`live-ai-toggle-${capture.angle}`}
                    checked={liveAiEnabled}
                    onChange={(e) => setLiveAiEnabled(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor={`live-ai-toggle-${capture.angle}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: liveAiEnabled ? 'var(--success)' : 'var(--text-3)', transition: 'background 0.3s ease' }} />
                    Live AI
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={handleCloseCamera}
              >
                Batal
              </button>
              {capturedImage ? (
                <>
                  <button className="btn btn-secondary" onClick={retakePhoto}>
                    Ambil Ulang
                  </button>
                  <button className="btn btn-primary" onClick={saveCapturedPhoto}>
                    Gunakan & Deteksi AI
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={capturePhoto} disabled={!stream}>
                  Ambil Foto
                </button>
              )}
            </div>
          </div>
        }
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
          {capturedImage ? (
            <img src={capturedImage} alt="Captured preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />



              {/* Live Damage Bounding Boxes Overlay */}
              {liveAiEnabled && liveDamages.map((d) => {
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
                      boxShadow: `0 0 6px ${color}`,
                      pointerEvents: 'none',
                      zIndex: 5,
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

              {/* Scan Overlay target guide */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '3px dashed rgba(99, 102, 241, 0.4)',
                  margin: '30px 40px',
                  borderRadius: 8,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    background: 'rgba(7, 12, 24, 0.8)',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    textAlign: 'center',
                  }}
                >
                  {angleInstruction[capture.angle] || 'Align the vehicle within the frame'}
                </div>
              </div>
            </>
          )}
          {/* Off-screen canvas for capturing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </Modal>
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
