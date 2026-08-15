import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  change?: number;        // % change, positive = good
  trend?: number[];       // sparkline data points
  icon: React.ReactNode;
  iconColor: string;      // css color
  iconBg: string;         // css color
  unit?: string;          // e.g. '%', 'K'
  delay?: number;         // stagger animation delay (0-4)
}

function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (!Array.isArray(data) || data.length < 2) return null;

  const W = 90;
  const H = 36;
  const pad = 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return { x, y };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${(W - pad).toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="3"
        fill={color}
        stroke="var(--bg-card)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  iconColor,
  iconBg,
  unit = '',
  delay = 0,
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  const delayClass = ['', 'delay-100', 'delay-200', 'delay-300', 'delay-400'][delay] ?? '';

  return (
    <div
      className={`card animate-fade-in-up ${delayClass}`}
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* Top row: icon + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Sparkline */}
        {trend && trend.length > 1 && (
          <Sparkline data={trend} color={iconColor} />
        )}
      </div>

      {/* Bottom row: value + label + trend */}
      <div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--text-1)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {value}{unit}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>

        {change !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
            }}
          >
            {isPositive ? (
              <TrendingUp size={13} style={{ color: 'var(--success)' }} />
            ) : (
              <TrendingDown size={13} style={{ color: 'var(--danger)' }} />
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isPositive ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
