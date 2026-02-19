'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, clearToken } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/ingest', label: 'Ingest Data', icon: '📥' },
  { href: '/dashboard/health', label: 'Health', icon: '🏥' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  if (!mounted) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Pipeline Dashboard</h2>
          <p>Data Microservices</p>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
          <div style={{ flex: 1, minHeight: 40 }} />
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ border: 'none', background: 'none', textAlign: 'left' }}
          >
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
