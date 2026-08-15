import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
}

export default function PageHeader({ title, subtitle, actions, stats }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {/* Left */}
      <div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-1)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 5 }}>{subtitle}</p>
        )}
        {/* Quick stats inline */}
        {stats && stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 12,
              flexWrap: 'wrap',
            }}
          >
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: s.color ?? 'var(--accent-light)',
                  }}
                >
                  {s.value}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Action buttons */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
