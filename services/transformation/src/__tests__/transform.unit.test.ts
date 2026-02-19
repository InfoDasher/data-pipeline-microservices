import { describe, it, expect } from 'vitest';

// Pure function tests for transformation logic (no DB dependency)

interface TestRecord {
  productName: string;
  quantity: number;
  unitPrice: number;
  saleDate: string;
}

function calculateTotalRevenue(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

function deduplicateRecords(records: TestRecord[]): {
  unique: TestRecord[];
  duplicateCount: number;
} {
  const seen = new Set<string>();
  let duplicateCount = 0;
  const unique = records.filter((record) => {
    const key = `${record.productName}|${record.quantity}|${record.unitPrice}|${record.saleDate}`;
    if (seen.has(key)) {
      duplicateCount++;
      return false;
    }
    seen.add(key);
    return true;
  });
  return { unique, duplicateCount };
}

function aggregateDaily(
  records: Array<{ productName: string; saleDate: string; quantity: number; totalRevenue: number }>,
): Map<
  string,
  { productName: string; saleDate: string; totalQuantity: number; totalRevenue: number }
> {
  const map = new Map<
    string,
    { productName: string; saleDate: string; totalQuantity: number; totalRevenue: number }
  >();
  for (const r of records) {
    const key = `${r.productName}|${r.saleDate}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalQuantity += r.quantity;
      existing.totalRevenue += r.totalRevenue;
    } else {
      map.set(key, {
        productName: r.productName,
        saleDate: r.saleDate,
        totalQuantity: r.quantity,
        totalRevenue: r.totalRevenue,
      });
    }
  }
  return map;
}

describe('Revenue Calculation', () => {
  it('should calculate revenue correctly for positive values', () => {
    expect(calculateTotalRevenue(10, 25.99)).toBeCloseTo(259.9);
  });

  it('should return 0 for zero price', () => {
    expect(calculateTotalRevenue(10, 0)).toBe(0);
  });

  it('should return 0 for zero quantity', () => {
    expect(calculateTotalRevenue(0, 25.99)).toBe(0);
  });

  it('should return negative revenue for negative quantity (refund)', () => {
    expect(calculateTotalRevenue(-5, 25.99)).toBeCloseTo(-129.95);
  });

  it('should handle large numbers', () => {
    expect(calculateTotalRevenue(100000, 999.99)).toBeCloseTo(99999000);
  });
});

describe('Deduplication', () => {
  it('should remove duplicate records', () => {
    const records: TestRecord[] = [
      { productName: 'Widget A', quantity: 10, unitPrice: 25.99, saleDate: '2026-01-15' },
      { productName: 'Widget A', quantity: 10, unitPrice: 25.99, saleDate: '2026-01-15' },
      { productName: 'Widget B', quantity: 5, unitPrice: 12.5, saleDate: '2026-01-15' },
    ];
    const { unique, duplicateCount } = deduplicateRecords(records);
    expect(unique).toHaveLength(2);
    expect(duplicateCount).toBe(1);
  });

  it('should keep all records when no duplicates', () => {
    const records: TestRecord[] = [
      { productName: 'Widget A', quantity: 10, unitPrice: 25.99, saleDate: '2026-01-15' },
      { productName: 'Widget B', quantity: 5, unitPrice: 12.5, saleDate: '2026-01-16' },
    ];
    const { unique, duplicateCount } = deduplicateRecords(records);
    expect(unique).toHaveLength(2);
    expect(duplicateCount).toBe(0);
  });

  it('should consider different dates as unique', () => {
    const records: TestRecord[] = [
      { productName: 'Widget A', quantity: 10, unitPrice: 25.99, saleDate: '2026-01-15' },
      { productName: 'Widget A', quantity: 10, unitPrice: 25.99, saleDate: '2026-01-16' },
    ];
    const { unique } = deduplicateRecords(records);
    expect(unique).toHaveLength(2);
  });
});

describe('Daily Aggregation', () => {
  it('should aggregate by product and date', () => {
    const records = [
      { productName: 'Widget A', saleDate: '2026-01-15', quantity: 10, totalRevenue: 259.9 },
      { productName: 'Widget A', saleDate: '2026-01-15', quantity: 5, totalRevenue: 129.95 },
      { productName: 'Widget B', saleDate: '2026-01-15', quantity: 3, totalRevenue: 37.5 },
    ];
    const aggregates = aggregateDaily(records);
    expect(aggregates.size).toBe(2);

    const widgetA = aggregates.get('Widget A|2026-01-15');
    expect(widgetA).toBeDefined();
    expect(widgetA!.totalQuantity).toBe(15);
    expect(widgetA!.totalRevenue).toBeCloseTo(389.85);

    const widgetB = aggregates.get('Widget B|2026-01-15');
    expect(widgetB).toBeDefined();
    expect(widgetB!.totalQuantity).toBe(3);
  });

  it('should separate different dates for the same product', () => {
    const records = [
      { productName: 'Widget A', saleDate: '2026-01-15', quantity: 10, totalRevenue: 259.9 },
      { productName: 'Widget A', saleDate: '2026-01-16', quantity: 5, totalRevenue: 129.95 },
    ];
    const aggregates = aggregateDaily(records);
    expect(aggregates.size).toBe(2);
  });

  it('should handle negative quantities in aggregation', () => {
    const records = [
      { productName: 'Widget A', saleDate: '2026-01-15', quantity: 10, totalRevenue: 259.9 },
      { productName: 'Widget A', saleDate: '2026-01-15', quantity: -3, totalRevenue: -77.97 },
    ];
    const aggregates = aggregateDaily(records);
    const widgetA = aggregates.get('Widget A|2026-01-15');
    expect(widgetA!.totalQuantity).toBe(7);
    expect(widgetA!.totalRevenue).toBeCloseTo(181.93);
  });
});
