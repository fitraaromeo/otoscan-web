import type { InspectionStatus, DamageSeverity, DamageType } from '@/app/_lib/types';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    dot: '#f59e0b',
  },
  in_progress: {
    label: 'In Progress',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    dot: '#06b6d4',
  },
  completed: {
    label: 'Completed',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    dot: '#10b981',
  },
  failed: {
    label: 'Failed',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
    dot: '#ef4444',
  },
};

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Vehicle Status Badge ─────────────────────────────────────────────────────
export function VehicleStatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: status === 'active' ? 'var(--success-bg)' : 'rgba(255,255,255,0.05)',
        color: status === 'active' ? 'var(--success)' : 'var(--text-3)',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: status === 'active' ? 'var(--success)' : 'var(--text-3)',
          flexShrink: 0,
        }}
      />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<DamageSeverity, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low', color: 'var(--success)', bg: 'var(--success-bg)' },
  medium: { label: 'Medium', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  high:   { label: 'High',  color: 'var(--danger)',  bg: 'var(--danger-bg)'  },
};

export function SeverityBadge({ severity }: { severity: DamageSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '3px 8px',
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Damage Type Badge ────────────────────────────────────────────────────────
const DAMAGE_LABEL: Record<DamageType, { label: string; emoji: string }> = {
  dent:          { label: 'Dent',           emoji: '🔵' },
  scratch:       { label: 'Scratch',        emoji: '🟡' },
  crack:         { label: 'Crack',          emoji: '🔴' },
  glass_shatter: { label: 'Glass Shatter',  emoji: '🟣' },
  lamp_broken:   { label: 'Broken Light',   emoji: '🟠' },
  tire_flat:     { label: 'Flat Tire',      emoji: '⚪' },
};

export function DamageTypeBadge({ type }: { type: DamageType }) {
  const info = DAMAGE_LABEL[type];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{info.emoji}</span>
      {info.label}
    </span>
  );
}
