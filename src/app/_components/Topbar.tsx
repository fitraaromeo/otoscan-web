'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronDown } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Dashboard', sub: 'System overview & statistics' },
  '/clients':   { title: 'Client Management', sub: 'Manage your client data' },
  '/vehicles':  { title: 'Vehicle Management', sub: 'Manage vehicle fleet' },
  '/inspections': { title: 'Inspection Management', sub: 'History & AI inspection reports' },
  '/master':    { title: 'Master Data Management', sub: 'Manage damage types, scan angles & statuses' },
};

function getBreadcrumb(pathname: string) {
  if (pathname.startsWith('/inspections/') && pathname !== '/inspections') {
    return {
      title: `Inspection Detail`,
      sub: `4-side AI scan result report`,
    };
  }
  return PAGE_TITLES[pathname] ?? { title: 'OtoScan AI', sub: '' };
}

export default function Topbar() {
  const pathname = usePathname();
  const { title, sub } = getBreadcrumb(pathname);

  return (
    <header
      style={{
        height: 68,
        background: 'var(--bg-topbar)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Left: Page title */}
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
          {title}
        </h1>
        {sub && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <button
          className="btn btn-ghost"
          style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)' }}
          title="Search"
        >
          <Search size={16} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 2 }}>Search...</span>
          <span
            style={{
              marginLeft: 16,
              fontSize: 11,
              color: 'var(--text-3)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              padding: '2px 6px',
              borderRadius: 5,
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Notification */}
        <button
          className="btn btn-ghost"
          style={{
            padding: 9,
            borderRadius: 10,
            border: '1px solid var(--border)',
            position: 'relative',
          }}
          title="Notifications"
        >
          <Bell size={17} style={{ color: 'var(--text-2)' }} />
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--danger)',
              border: '1.5px solid var(--bg-sidebar)',
            }}
          />
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: 'var(--border)',
            margin: '0 4px',
          }}
        />

        {/* Avatar */}
        <button
          className="btn btn-ghost"
          style={{
            padding: '6px 10px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            FR
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1 }}>
              Fitra Romeo
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Administrator</div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />
        </button>
      </div>
    </header>
  );
}
