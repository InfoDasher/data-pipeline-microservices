import { PrismaClient } from '@prisma/client';
import { getCached, setCache, buildCacheKey } from './cache';

interface ServiceHealth {
  service: string;
  status: 'up' | 'down';
  timestamp: string;
}

export interface SummaryQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface SummaryResponse {
  summary: {
    totalRevenue: number;
    totalQuantity: number;
    recordCount: number;
  };
  dailyBreakdown: Array<{
    productName: string;
    saleDate: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface DailyAggregateRow {
  productName: string;
  saleDate: Date;
  totalQuantity: number;
  totalRevenue: number | { toString(): string };
}

interface AggregateTotals {
  _sum: {
    totalQuantity: number | null;
    totalRevenue: number | { toString(): string } | null;
  };
  _count: number;
}

interface ProductBreakdownResponse {
  products: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    daysActive: number;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ReportingPrismaClient {
  $disconnect(): Promise<void>;
  dailyAggregate: {
    findMany(args: {
      where: Record<string, unknown>;
      orderBy?: { saleDate: 'asc' | 'desc' };
      skip?: number;
      take?: number;
    }): Promise<DailyAggregateRow[]>;
    count(args: { where: Record<string, unknown> }): Promise<number>;
    aggregate(args: {
      where: Record<string, unknown>;
      _sum: { totalQuantity: true; totalRevenue: true };
      _count: true;
    }): Promise<AggregateTotals>;
  };
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
}

const prisma = new PrismaClient() as unknown as ReportingPrismaClient;

export async function getSummary(query: SummaryQuery): Promise<SummaryResponse> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const cacheKey = buildCacheKey('summary', {
    from: query.from,
    to: query.to,
    page,
    limit,
  });

  const cached = getCached<SummaryResponse>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = {};
  if (query.from || query.to) {
    where.saleDate = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const [aggregates, total, totals] = await Promise.all([
    prisma.dailyAggregate.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.dailyAggregate.count({ where }),
    prisma.dailyAggregate.aggregate({
      where,
      _sum: {
        totalQuantity: true,
        totalRevenue: true,
      },
      _count: true,
    }),
  ]);

  const result = formatSummary(aggregates, totals, page, limit, total);
  setCache(cacheKey, result);
  return result;
}

function formatSummary(
  aggregates: DailyAggregateRow[],
  totals: AggregateTotals,
  page: number,
  limit: number,
  total: number,
): SummaryResponse {
  return {
    summary: {
      totalRevenue: Number(totals._sum.totalRevenue || 0),
      totalQuantity: totals._sum.totalQuantity || 0,
      recordCount: totals._count,
    },
    dailyBreakdown: aggregates.map((a) => ({
      productName: a.productName,
      saleDate: a.saleDate.toISOString().split('T')[0],
      totalQuantity: a.totalQuantity,
      totalRevenue: Number(a.totalRevenue),
    })),
    meta: { page, limit, total },
  };
}

export async function getProductBreakdown(query: SummaryQuery): Promise<ProductBreakdownResponse> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));

  const cacheKey = buildCacheKey('products', {
    from: query.from,
    to: query.to,
    page,
    limit,
  });

  const cached = getCached<ProductBreakdownResponse>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = {};
  if (query.from || query.to) {
    where.saleDate = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  // Get all aggregates matching filter, then group in JS
  const allAggregates = await prisma.dailyAggregate.findMany({ where });

  const productMap = new Map<
    string,
    { totalQuantity: number; totalRevenue: number; daysActive: Set<string> }
  >();

  for (const agg of allAggregates) {
    const existing = productMap.get(agg.productName);
    const dateStr = agg.saleDate.toISOString().split('T')[0];
    if (existing) {
      existing.totalQuantity += agg.totalQuantity;
      existing.totalRevenue += Number(agg.totalRevenue);
      existing.daysActive.add(dateStr);
    } else {
      productMap.set(agg.productName, {
        totalQuantity: agg.totalQuantity,
        totalRevenue: Number(agg.totalRevenue),
        daysActive: new Set([dateStr]),
      });
    }
  }

  const products = Array.from(productMap.entries())
    .map(([name, data]) => ({
      productName: name,
      totalQuantity: data.totalQuantity,
      totalRevenue: data.totalRevenue,
      daysActive: data.daysActive.size,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const total = products.length;
  const paginated = products.slice((page - 1) * limit, page * limit);

  const result = {
    products: paginated,
    meta: { page, limit, total },
  };

  setCache(cacheKey, result);
  return result;
}

export async function checkServicesHealth() {
  const ingestionUrl = process.env.INGESTION_URL || 'http://localhost:3001';
  const transformationUrl = process.env.TRANSFORMATION_URL || 'http://localhost:3002';

  const checkService = async (name: string, url: string): Promise<ServiceHealth> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      return {
        service: name,
        status: response.ok ? ('up' as const) : ('down' as const),
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        service: name,
        status: 'down' as const,
        timestamp: new Date().toISOString(),
      };
    }
  };

  // Check DB
  let dbStatus: 'up' | 'down' = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'down';
  }

  const [ingestion, transformation] = await Promise.all([
    checkService('ingestion', ingestionUrl),
    checkService('transformation', transformationUrl),
  ]);

  return {
    services: [
      ingestion,
      transformation,
      {
        service: 'database',
        status: dbStatus,
        timestamp: new Date().toISOString(),
      },
      {
        service: 'reporting',
        status: 'up' as const,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export { prisma };
