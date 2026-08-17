'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/_context/AuthContext';
import { fetchInspectionByIDApi, formatDateTime } from '@/app/_lib/api';
import { mockInspections } from '@/app/_lib/mock-data';
import type { Inspection, AngleCapture, DamageItem } from '@/app/_lib/types';
import { InspectionStatusBadge, DamageTypeBadge } from '@/app/_components/Badge';

const ANGLE_LABELS: Record<string, string> = {
  front: 'Front Angle (Depan)',
  rear: 'Rear Angle (Belakang)',
  left: 'Left Angle (Samping Kiri)',
  right: 'Right Angle (Samping Kanan)',
};

export default function UserInspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const inspectionId = resolvedParams.id;
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeImageModal, setActiveImageModal] = useState<AngleCapture | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
      return;
    }

    async function loadDetail() {
      setIsLoading(true);
      try {
        const data = await fetchInspectionByIDApi(inspectionId);
        if (data) {
          setInspection(data);
        } else {
          // Fallback to mock data if API returns null
          const mockMatch = mockInspections.find((i) => i.id === inspectionId);
          if (mockMatch) setInspection(mockMatch);
        }
      } catch (err) {
        console.error('Failed to load inspection detail:', err);
        const mockMatch = mockInspections.find((i) => i.id === inspectionId);
        if (mockMatch) setInspection(mockMatch);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadDetail();
    }
  }, [inspectionId, user, isAuthLoading, router]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-medium text-slate-400">Loading AI Damage Report...</span>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Inspection Report Not Found</h3>
          <p className="text-xs text-slate-400 mb-6">The requested inspection report ID does not exist or has been removed.</p>
          <button
            onClick={() => router.push('/user')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate total damages list across all angles
  const allDamagesList: { angle: string; damage: DamageItem }[] = [];
  inspection.angles.forEach((ang) => {
    ang.damages.forEach((dmg) => {
      allDamagesList.push({ angle: ang.angle, damage: dmg });
    });
  });

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/user')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
                OtoScan AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                AI Damage Report
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full p-4 sm:p-8 space-y-6">
        {/* HERO REPORT HEADER CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="px-3.5 py-1 rounded-xl bg-slate-950 border border-slate-700 font-mono font-bold text-base text-amber-300 tracking-wider">
                  {inspection.licensePlate}
                </span>
                <InspectionStatusBadge status={inspection.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {inspection.vehicleName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Scan Conducted: <span className="text-slate-200 font-medium">{formatDateTime(inspection.startedAt || inspection.createdAt)}</span> • Inspector: <span className="text-slate-200 font-medium">{inspection.inspectorName || 'OtoScan AI Bot'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 shrink-0">
              <div className="text-center px-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Damages</p>
                <p className={`text-2xl font-black mt-0.5 ${allDamagesList.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {allDamagesList.length} <span className="text-xs font-normal text-slate-400">spots</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: 4-ANGLE CAMERA CAPTURES GALLERY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Multi-Angle AI Damage Captures</h2>
              <p className="text-xs text-slate-400">High-resolution vehicle scans with YOLOv12 AI damage bounding box annotations. Click any image to enlarge.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inspection.angles.map((ang) => {
              const displayUrl = ang.resultUrl || ang.imageUrl;
              const damageCount = ang.damages.length;

              return (
                <div
                  key={ang.angle}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 hover:border-cyan-500/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400" />
                      <h3 className="font-bold text-sm text-white capitalize">{ANGLE_LABELS[ang.angle] || `${ang.angle} Angle`}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        damageCount > 0
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {damageCount > 0 ? `${damageCount} Damage Spots Detected` : 'Clean / No Damage'}
                    </span>
                  </div>

                  {/* IMAGE PREVIEW CONTAINER */}
                  <div
                    onClick={() => displayUrl && setActiveImageModal(ang)}
                    className={`relative w-full aspect-[16/10] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center ${
                      displayUrl ? 'cursor-pointer group-hover:brightness-110' : ''
                    } transition-opacity`}
                  >
                    {displayUrl ? (
                      <>
                        <img
                          src={displayUrl}
                          alt={`${ang.angle} Angle Scan`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="px-3 py-1.5 bg-slate-900 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-500/30 shadow-lg flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                            Enlarge & Inspect Image
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 text-slate-500">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No camera image uploaded for this angle</p>
                      </div>
                    )}
                  </div>

                  {/* ANGLE DETECTIONS SUMMARY */}
                  {damageCount > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {ang.damages.map((dmg) => (
                          <div
                            key={dmg.id}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center gap-2"
                          >
                            <DamageTypeBadge type={dmg.type} />
                            <span className="text-cyan-400 font-mono text-[11px]">
                              {Math.round(dmg.confidence * 100)}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: DETAILED DAMAGE DETECTIONS LIST */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Full Damage Diagnosis Breakdown</h2>
              <p className="text-xs text-slate-400">Granular list of damage detections, location angles, and AI confidence ratings.</p>
            </div>
          </div>

          {allDamagesList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Clean Inspection — No Damages Detected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                OtoScan AI did not detect any scratches, dents, cracks, or glass shatters on all camera angles for this vehicle.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6 font-semibold">#</th>
                      <th className="py-4 px-6 font-semibold">Damage Type</th>
                      <th className="py-4 px-6 font-semibold">Angle Location</th>
                      <th className="py-4 px-6 font-semibold">AI Confidence Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {allDamagesList.map((item, idx) => (
                      <tr key={item.damage.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-6">
                          <DamageTypeBadge type={item.damage.type} />
                        </td>
                        <td className="py-4 px-6 font-medium text-white capitalize">
                          {ANGLE_LABELS[item.angle] || item.angle}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-cyan-400">
                          {(item.damage.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>


      </main>

      {/* ─── LIGHTBOX MODAL FOR ENLARGED IMAGE VIEW ────────────────────────── */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-lg text-white capitalize">{ANGLE_LABELS[activeImageModal.angle] || `${activeImageModal.angle} Angle`}</h3>
                <p className="text-xs text-slate-400">Vehicle Scan Detail — {inspection.licensePlate}</p>
              </div>
              <button
                onClick={() => setActiveImageModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="w-full max-h-[70vh] overflow-hidden rounded-2xl border border-slate-800 flex items-center justify-center bg-black">
              <img
                src={activeImageModal.resultUrl || activeImageModal.imageUrl || ''}
                alt={`${activeImageModal.angle} High Res Scan`}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Total Damage Annotations: <span className="text-amber-400 font-bold">{activeImageModal.damages.length}</span>
              </span>
              <button
                onClick={() => setActiveImageModal(null)}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
              >
                Close High-Res View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
