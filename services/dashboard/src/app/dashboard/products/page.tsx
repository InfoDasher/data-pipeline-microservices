'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchProducts } from '@/lib/api';
import { Product } from '@/lib/types';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchProducts({
        from: from || undefined,
        to: to || undefined,
        limit: 50,
      });
      if (res.success) {
        setProducts(res.data);
      } else {
        setError('Failed to load products');
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
      <h1 className="page-title">Products</h1>

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
          {products.length > 0 && (
            <div className="card">
              <div className="card-title">Revenue by Product</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis type="number" stroke="#888" fontSize={12} />
                    <YAxis
                      dataKey="productName"
                      type="category"
                      stroke="#888"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#141414',
                        border: '1px solid #262626',
                        borderRadius: 6,
                        color: '#ededed',
                      }}
                      formatter={(value: number) => [fmt(value), 'Revenue']}
                    />
                    <Bar dataKey="totalRevenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div className="card">
              <div className="card-title">Product Detail</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Total Quantity</th>
                      <th>Total Revenue</th>
                      <th>Days Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.productName}>
                        <td>{p.productName}</td>
                        <td>{p.totalQuantity.toLocaleString()}</td>
                        <td>{fmt(p.totalRevenue)}</td>
                        <td>{p.daysActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {products.length === 0 && !error && (
            <div className="card">
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No products yet. Ingest some sales records first.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
