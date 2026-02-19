'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchHealth } from '@/lib/api';
import { ServiceHealth } from '@/lib/types';

export default function HealthPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchHealth();
      if (res.success) {
        setServices(res.data);
        setLastRefresh(new Date().toLocaleTimeString());
      } else {
        setError('Failed to load health data');
      }
    } catch {
      setError('Could not reach reporting service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  const allUp = services.length > 0 && services.every((s) => s.status === 'up');

  return (
    <>
      <h1 className="page-title">Service Health</h1>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Overall Status</div>
          <div className="stat-value" style={{ color: allUp ? 'var(--green)' : 'var(--red)' }}>
            {loading ? '...' : allUp ? 'All Systems Operational' : 'Degraded'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Refresh</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {lastRefresh || '—'}
          </div>
          <button className="btn btn-primary btn-sm" onClick={load} style={{ marginTop: 8 }}>
            Refresh Now
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && services.length === 0 ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Services</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Checked At</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.service}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{s.service}</td>
                    <td>
                      <span className={`badge ${s.status === 'up' ? 'badge-up' : 'badge-down'}`}>
                        {s.status === 'up' ? '● Up' : '● Down'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: 12,
          marginTop: 8,
        }}
      >
        Auto-refreshes every 15 seconds
      </p>
    </>
  );
}
