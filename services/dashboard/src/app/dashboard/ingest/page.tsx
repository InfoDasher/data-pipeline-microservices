'use client';

import { useState } from 'react';
import { ingestRecords } from '@/lib/api';
import { BatchResult } from '@/lib/types';

const SAMPLE_DATA = JSON.stringify(
  [
    {
      product_name: 'Widget A',
      quantity: 10,
      unit_price: 25.99,
      sale_date: '2026-01-15',
    },
    {
      product_name: 'Widget B',
      quantity: 5,
      unit_price: 49.99,
      sale_date: '2026-01-15',
    },
    {
      product_name: 'Widget A',
      quantity: 3,
      unit_price: 25.99,
      sale_date: '2026-01-16',
    },
  ],
  null,
  2,
);

export default function IngestPage() {
  const [payload, setPayload] = useState(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const records = JSON.parse(payload);
      const res = await ingestRecords(records);
      if (res.success) {
        setResult(res.data);
      } else {
        setError('Ingestion failed');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON payload');
      } else {
        setError('Could not reach ingestion service');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Ingest Data</h1>

      <div className="card">
        <div className="card-title">Submit Sales Records</div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Paste a JSON array of sales records. Each record needs{' '}
          <code>product_name</code>, <code>quantity</code>,{' '}
          <code>unit_price</code>, and <code>sale_date</code>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>JSON Payload</label>
            <textarea
              className="input"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={12}
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !payload.trim()}
          >
            {loading ? 'Ingesting...' : 'Ingest Records'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="alert alert-success">
          <strong>Success!</strong> Batch{' '}
          <code>{result.batchId}</code> — {result.recordCount} records
          ingested ({result.status}).
          {result.errors.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <strong>Warnings:</strong>
              <ul style={{ margin: '4px 0 0 16px' }}>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 8 }}>
        <div className="card-title">Sample Record Schema</div>
        <pre
          style={{
            background: 'var(--bg)',
            padding: 16,
            borderRadius: 6,
            fontSize: 13,
            overflow: 'auto',
          }}
        >
          {`{
  "product_name": "string (required, min 1 char)",
  "quantity":     "integer (required)",
  "unit_price":   "number (required, >= 0)",
  "sale_date":    "string (required, valid date)"
}`}
        </pre>
      </div>
    </>
  );
}
