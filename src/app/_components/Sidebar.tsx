'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Zap,
  Database,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
  },
  {
    href: '/vehicles',
    label: 'Vehicles',
    icon: Car,
  },
  {
    href: '/inspections',
    label: 'Inspections',
    icon: ClipboardList,
  },
  {
    href: '/master',
    label: 'Master Data',
    icon: Database,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 72 : 240,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
          justifyContent: collapsed ? 'center' : 'flex-start',
          height: 68,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}
        >
          <Zap size={18} color="#fff" fill="#fff" />
        </div>

        {/* Brand name */}
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div
              className="gradient-text"
              style={{ fontWeight: 800, fontSize: 16, lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              OtoScan AI
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>
              Inspection System
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0 6px',
              marginBottom: 8,
            }}
          >
            Main Menu
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <Icon
                size={18}
                style={{
                  flexShrink: 0,
                  color: isActive ? 'var(--accent-light)' : 'var(--text-3)',
                  transition: 'color 0.2s',
                }}
              />
              {!collapsed && (
                <span style={{ fontSize: 14 }}>{item.label}</span>
              )}

              {/* Active dot for collapsed */}
              {collapsed && isActive && (
                <span
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse Toggle ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            color: 'var(--text-3)',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span style={{ fontSize: 13 }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
