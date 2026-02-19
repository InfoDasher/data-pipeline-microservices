'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchSummary } from '@/lib/api';
import { SummaryData, DailyBreakdown } from '@/lib/types';

export default function OverviewPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [breakdown, setBreakdown] = useState<DailyBreakdown[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSummary({
        from: from || undefined,
        to: to || undefined,
        limit: 50,
      });
      if (res.success) {
        setSummary(res.data);
        setBreakdown(res.dailyBreakdown || []);
      } else {
        setError('Failed to load summary');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        setError('Session expired. Please log in again.');
        router.replace('/login');
        return;
      }
      setError('Could not reach reporting service');
    } finally {
      setLoading(false);
    }
  }, [from, to, router]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(n);

  return (
    <>
      <h1 className="page-title">Overview</h1>

      <div className="filter-row">
        <div className="form-group">
          <label>From</label>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={load}>
          Apply
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{fmt(summary?.totalRevenue ?? 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Quantity Sold</div>
              <div className="stat-value">{(summary?.totalQuantity ?? 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Aggregate Records</div>
              <div className="stat-value">{(summary?.recordCount ?? 0).toLocaleString()}</div>
            </div>
          </div>

          {breakdown.length > 0 && (
            <div className="card">
              <div className="card-title">Daily Revenue</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="saleDate" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        background: '#141414',
                        border: '1px solid #262626',
                        borderRadius: 6,
                        color: '#ededed',
                      }}
                      formatter={(value: number) => [fmt(value), 'Revenue']}
                    />
                    <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {breakdown.length > 0 && (
            <div className="card">
              <div className="card-title">Daily Breakdown</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row, i) => (
                      <tr key={i}>
                        <td>{row.saleDate}</td>
                        <td>{row.productName}</td>
                        <td>{row.totalQuantity}</td>
                        <td>{fmt(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {breakdown.length === 0 && !error && (
            <div className="card">
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No data yet. Ingest some sales records to see reports.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
