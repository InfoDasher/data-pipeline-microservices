import { describe, it, expect } from 'vitest';
import { IngestPayloadSchema, SalesRecordSchema } from '@mono/shared';

describe('SalesRecord Validation', () => {
  it('should accept a valid sales record', () => {
    const record = {
      product_name: 'Widget A',
      quantity: 10,
      unit_price: 25.99,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it('should reject record with missing product_name', () => {
    const record = {
      quantity: 10,
      unit_price: 25.99,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject record with missing quantity', () => {
    const record = {
      product_name: 'Widget A',
      unit_price: 25.99,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject record with missing unit_price', () => {
    const record = {
      product_name: 'Widget A',
      quantity: 10,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject record with missing sale_date', () => {
    const record = {
      product_name: 'Widget A',
      quantity: 10,
      unit_price: 25.99,
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject record with invalid sale_date', () => {
    const record = {
      product_name: 'Widget A',
      quantity: 10,
      unit_price: 25.99,
      sale_date: 'not-a-date',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject record with empty product_name', () => {
    const record = {
      product_name: '',
      quantity: 10,
      unit_price: 25.99,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should reject negative unit_price', () => {
    const record = {
      product_name: 'Widget A',
      quantity: 10,
      unit_price: -5,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });

  it('should accept zero unit_price', () => {
    const record = {
      product_name: 'Widget A',
      quantity: 10,
      unit_price: 0,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it('should accept negative quantity (refund scenario)', () => {
    const record = {
      product_name: 'Widget A',
      quantity: -5,
      unit_price: 25.99,
      sale_date: '2026-01-15',
    };
    const result = SalesRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });
});

describe('IngestPayload Validation', () => {
  it('should accept an array of valid records', () => {
    const payload = [
      { product_name: 'Widget A', quantity: 10, unit_price: 25.99, sale_date: '2026-01-15' },
      { product_name: 'Widget B', quantity: 5, unit_price: 12.5, sale_date: '2026-01-16' },
    ];
    const result = IngestPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject an empty array', () => {
    const result = IngestPayloadSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it('should reject if any record is invalid', () => {
    const payload = [
      { product_name: 'Widget A', quantity: 10, unit_price: 25.99, sale_date: '2026-01-15' },
      { product_name: '', quantity: 5, unit_price: 12.5, sale_date: '2026-01-16' },
    ];
    const result = IngestPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
