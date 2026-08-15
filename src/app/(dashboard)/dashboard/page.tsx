'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/app/_components/StatCard';
import { InspectionStatusBadge, DamageTypeBadge } from '@/app/_components/Badge';
import {
  Users,
  Car,
  ClipboardList,
  Cpu,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { Client, Vehicle, Inspection } from '@/app/_lib/types';
import { fetchUsersApi, fetchVehiclesApi, fetchInspectionsApi } from '@/app/_lib/api';

// ── SVG Area Chart ─────────────────────────────────────────────────────────────
function AreaChart({
  data,
}: {
  data: { month: string; value: number }[];
}) {
  const W = 600;
  const H = 160;
  const PL = 36;
  const PB = 28;
  const PR = 10;
  const PT = 10;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const max = Math.max(1, ...data.map((d) => d.value));

  const pts = data.map((d, i) => ({
    x: PL + (i / (Math.max(1, data.length - 1))) * cW,
    y: PT + cH - (d.value / max) * cH,
    label: d.month,
    value: d.value,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PB} L ${PL} ${H - PB} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PT + f * cH,
    label: Math.round(max * (1 - f)),
  }));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={PL}
            y1={g.y}
            x2={W - PR}
            y2={g.y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <text
            x={PL - 6}
            y={g.y + 4}
            fill="var(--text-3)"
            fontSize="10"
            textAnchor="end"
            fontFamily="sans-serif"
          >
            {g.label}
          </text>
        </g>
      ))}

      {/* Area */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="#0c1221" strokeWidth="2" />
          <text
            x={p.x}
            y={H - 8}
            fill="var(--text-3)"
            fontSize="10"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── SVG Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  let accumulated = 0;
  const R = 54;
  const C = 2 * Math.PI * R;

  const activeItems = data.filter((d) => d.count > 0);

  const arcs = activeItems.map((d) => {
    const pct = total > 0 ? d.count / total : 0;
    const dash = pct * C;
    const offset = C - accumulated * C;
    accumulated += pct;
    return { ...d, dash, offset, pct };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth="18"
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={a.offset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'all 0.5s ease' }}
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Damages</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, opacity: d.count > 0 ? 1 : 0.4 }} />
                <span style={{ color: d.count > 0 ? 'var(--text-2)' : 'var(--text-3)' }}>{d.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: d.count > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>{d.count}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 11 }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRealData = async () => {
    setLoading(true);
    try {
      const [uRes, vRes, iRes] = await Promise.all([
        fetchUsersApi(),
        fetchVehiclesApi(),
        fetchInspectionsApi(),
      ]);
      setClients(uRes.clients);
      setVehicles(vRes.vehicles);
      setInspections(iRes.inspections);
    } catch {
      // fallback handled inside API service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const totalClientsCount = clients.length;
  const totalVehiclesCount = vehicles.length;
  const totalInspectionsCount = inspections.length;
  const completedInspectionsCount = inspections.filter((i) => i.status === 'completed').length;
  const inProgressCount = inspections.filter((i) => i.status === 'in_progress').length;
  const pendingCount = inspections.filter((i) => i.status === 'pending').length;
  const failedCount = inspections.filter((i) => i.status === 'failed').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInspectionsCount = inspections.filter((i) => i.createdAt === todayStr).length;

  const allDamages = inspections.flatMap((i) => i.angles.flatMap((a) => a.damages));
  const damageCounts: Record<string, number> = {};
  allDamages.forEach((d) => {
    const key = (d.type || '').toLowerCase();
    damageCounts[key] = (damageCounts[key] || 0) + 1;
  });

  const damageColorMap: Record<string, string> = {
    dent: '#6366f1',
    scratch: '#f59e0b',
    crack: '#ef4444',
    glass_shatter: '#8b5cf6',
    lamp_broken: '#06b6d4',
    tire_flat: '#10b981',
  };

  const damageBreakdown = [
    { label: 'Dent', count: damageCounts['dent'] || 0, color: damageColorMap['dent'] },
    { label: 'Scratch', count: damageCounts['scratch'] || 0, color: damageColorMap['scratch'] },
    { label: 'Crack', count: damageCounts['crack'] || 0, color: damageColorMap['crack'] },
    { label: 'Glass Shatter', count: damageCounts['glass_shatter'] || damageCounts['glass'] || 0, color: damageColorMap['glass_shatter'] },
    { label: 'Broken Light', count: damageCounts['lamp_broken'] || damageCounts['lamp'] || 0, color: damageColorMap['lamp_broken'] },
    { label: 'Flat / Damaged Tire', count: damageCounts['tire_flat'] || damageCounts['tire'] || 0, color: damageColorMap['tire_flat'] },
  ];

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const recentInspections = inspections.slice(0, 5);

  // Extract available years from real inspection dates in PostgreSQL
  const availableYears = Array.from(
    new Set([
      currentYear,
      ...inspections
        .map((i) => (i.createdAt ? new Date(i.createdAt).getFullYear() : null))
        .filter((y): y is number => y !== null && !isNaN(y)),
    ])
  ).sort((a, b) => b - a);

  // Build 12-month trend for selectedYear (Jan - Dec)
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCounts = new Array(12).fill(0);

  inspections.forEach((ins) => {
    if (ins.createdAt) {
      const d = new Date(ins.createdAt);
      if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
        const monthIdx = d.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          monthlyCounts[monthIdx] += 1;
        }
      }
    }
  });

  const yearlyTrend = monthLabels.map((m, idx) => ({
    month: m,
    value: monthlyCounts[idx],
  }));

  // Monthly percentage change calculator vs last month
  const calculateMonthlyChange = (dateList: (string | undefined | null)[]) => {
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth();

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    dateList.forEach((dStr) => {
      if (!dStr) return;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return;

      const y = d.getFullYear();
      const m = d.getMonth();

      if (y === currentY && m === currentM) {
        thisMonthCount++;
      } else if (
        (currentM === 0 && y === currentY - 1 && m === 11) ||
        (y === currentY && m === currentM - 1)
      ) {
        lastMonthCount++;
      }
    });

    let percentChange = 0;
    if (lastMonthCount === 0) {
      percentChange = thisMonthCount > 0 ? 100 : 0;
    } else {
      percentChange = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
    }

    const midPoint = Math.round((lastMonthCount + thisMonthCount) / 2);
    const trend = [
      Math.max(1, lastMonthCount),
      Math.max(1, Math.round((lastMonthCount + midPoint) / 2)),
      Math.max(1, midPoint),
      Math.max(1, thisMonthCount),
    ];

    return { percentChange, trend };
  };

  const clientStats = calculateMonthlyChange(clients.map((c) => c.createdAt));
  const vehicleStats = calculateMonthlyChange(vehicles.map((v) => v.createdAt));
  const inspectionStats = calculateMonthlyChange(inspections.map((i) => i.createdAt || i.startedAt));
  const damageDates = inspections.flatMap((i) =>
    i.angles.flatMap((a) => a.damages.map(() => i.createdAt || i.startedAt))
  );
  const damageStats = calculateMonthlyChange(damageDates);

  return (
    <div style={{ width: '100%' }}>
      {/* Greeting banner */}
      <div
        className="animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 600, marginBottom: 4 }}>
            👋 Welcome back
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Fitra Romeo Winky
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Pending', value: pendingCount, color: 'var(--warning)' },
            { label: 'In Progress', value: inProgressCount, color: 'var(--info)' },
            { label: 'Completed', value: completedInspectionsCount, color: 'var(--success)' },
            { label: 'Failed', value: failedCount, color: 'var(--danger)' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.label}</div>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadRealData}
            disabled={loading}
            title="Refresh Data"
            style={{ marginLeft: 10 }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Clients"
          value={totalClientsCount}
          change={clientStats.percentChange}
          trend={clientStats.trend}
          icon={<Users size={20} />}
          iconColor="#6366f1"
          iconBg="rgba(99,102,241,0.15)"
          delay={0}
        />
        <StatCard
          label="Total Fleet Vehicles"
          value={totalVehiclesCount}
          change={vehicleStats.percentChange}
          trend={vehicleStats.trend}
          icon={<Car size={20} />}
          iconColor="#06b6d4"
          iconBg="rgba(6,182,212,0.15)"
          delay={1}
        />
        <StatCard
          label="Total Inspection Sessions"
          value={totalInspectionsCount}
          change={inspectionStats.percentChange}
          trend={inspectionStats.trend}
          icon={<ClipboardList size={20} />}
          iconColor="#10b981"
          iconBg="rgba(16,185,129,0.15)"
          delay={2}
        />
        <StatCard
          label="Total AI Findings"
          value={allDamages.length}
          change={damageStats.percentChange}
          trend={damageStats.trend}
          icon={<Cpu size={20} />}
          iconColor="#8b5cf6"
          iconBg="rgba(139,92,246,0.15)"
          delay={3}
        />
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Trend Area Chart */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Vehicle Inspection Session Trend ({selectedYear})
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
                Monthly statistics (Jan — Dec) for year {selectedYear}
              </p>
            </div>
            <select
              className="form-input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ width: 'auto', padding: '6px 12px', fontSize: 12, borderRadius: 8 }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
          <AreaChart data={yearlyTrend} />
        </div>

        {/* Damage Distribution Donut */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              AI Damage Distribution
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
              YOLOv12 findings percentage
            </p>
          </div>
          <DonutChart data={damageBreakdown} />
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              Recent Vehicle Inspections
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
              Latest 5 inspection sessions in system
            </p>
          </div>
          <Link
            href="/inspections"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-light)' }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Client / Owner</th>
                <th>Inspector</th>
                <th>Damage Findings</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '30px 0' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 6px', color: 'var(--accent)' }} />
                    Loading data...
                  </td>
                </tr>
              ) : recentInspections.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '30px 0' }}>
                    No inspection data yet
                  </td>
                </tr>
              ) : (
                recentInspections.map((ins) => (
                  <tr key={ins.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 13, fontFamily: 'monospace' }}>
                        {ins.licensePlate}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ins.vehicleName}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{ins.clientName}</td>
                    <td style={{ fontSize: 13 }}>{ins.inspectorName}</td>
                    <td>
                      {ins.totalDamages > 0 ? (
                        <span style={{ fontWeight: 700, color: ins.totalDamages > 2 ? 'var(--danger)' : 'var(--warning)', fontSize: 13 }}>
                          {ins.totalDamages} findings
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>✅ Clean</span>
                      )}
                    </td>
                    <td>
                      <InspectionStatusBadge status={ins.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/inspections/${ins.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--accent-light)' }}
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
