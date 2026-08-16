'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/app/_context/AuthContext';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Admin Dashboard', sub: 'System overview & inspection statistics' },
  '/clients': { title: 'Client Management', sub: 'Manage registered clients & users' },
  '/vehicles': { title: 'Vehicle Management', sub: 'Manage registered vehicle fleet' },
  '/inspections': { title: 'Inspection Management', sub: 'History & AI damage analysis reports' },
  '/live-detector': { title: 'Live AI Detector', sub: 'Real-time camera detection via YOLOv12' },
  '/master': { title: 'Master Data Management', sub: 'Manage damage types, angle captures & statuses' },
};

function getBreadcrumb(pathname: string) {
  if (pathname.startsWith('/inspections/') && pathname !== '/inspections') {
    return {
      title: `Inspection Report Detail`,
      sub: `4-angle AI damage detection report`,
    };
  }
  return PAGE_TITLES[pathname] ?? { title: 'OtoScan AI', sub: 'Vehicle Inspection System' };
}

export default function Topbar() {
  const pathname = usePathname();
  const { title, sub } = getBreadcrumb(pathname);
  const { user, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

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

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn btn-ghost"
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
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
              {getInitials(user?.name)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1 }}>
                {user?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, textTransform: 'capitalize' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />
          </button>

          {/* Menu Popup */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 48,
                width: 200,
                background: '#0F172A',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '6px',
                zIndex: 50,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#F87171',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
