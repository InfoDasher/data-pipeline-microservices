import { PrismaClient } from '@prisma/client';

interface BatchRow {
  id: string;
}

interface NormalisedRecordRow {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  saleDate: Date;
}

interface TransformationResultRow {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  saleDate: Date;
}

interface DailyAggregateRow {
  productName: string;
  saleDate: Date;
  totalQuantity: number;
  totalRevenue: number;
}

interface TransformationPrismaClient {
  batch: {
    findUnique(args: { where: { id: string } }): Promise<BatchRow | null>;
    update(args: {
      where: { id: string };
      data: { status: string; errorMessage?: string };
    }): Promise<unknown>;
  };
  normalisedRecord: {
    findMany(args: { where: { batchId: string } }): Promise<NormalisedRecordRow[]>;
  };
  transformationResult: {
    createMany(args: {
      data: Array<{
        batchId: string;
        recordId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalRevenue: number;
        saleDate: Date;
      }>;
    }): Promise<unknown>;
    findMany(args: { where: { batchId: string } }): Promise<TransformationResultRow[]>;
  };
  dailyAggregate: {
    upsert(args: {
      where: {
        batchId_productName_saleDate: {
          batchId: string;
          productName: string;
          saleDate: Date;
        };
      };
      create: {
        batchId: string;
        productName: string;
        saleDate: Date;
        totalQuantity: number;
        totalRevenue: number;
      };
      update: {
        totalQuantity: number;
        totalRevenue: number;
      };
    }): Promise<unknown>;
    findMany(args: { where: { batchId: string } }): Promise<DailyAggregateRow[]>;
  };
}

const prisma = new PrismaClient() as unknown as TransformationPrismaClient;

export interface TransformSummary {
  batchId: string;
  recordsTransformed: number;
  aggregatesCreated: number;
  warnings: string[];
}

export async function transformBatch(batchId: string): Promise<TransformSummary> {
  // Verify batch exists
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    throw new Error('Batch not found');
  }

  // Update batch status to processing
  await prisma.batch.update({
    where: { id: batchId },
    data: { status: 'processing' },
  });

  const warnings: string[] = [];

  try {
    // Fetch normalised records for this batch
    const records = await prisma.normalisedRecord.findMany({
      where: { batchId },
    });

    if (records.length === 0) {
      throw new Error('No records found for batch');
    }

    // Deduplicate records (same product_name, quantity, unit_price, sale_date)
    const seen = new Set<string>();
    const uniqueRecords = records.filter((record) => {
      const key = `${record.productName}|${record.quantity}|${record.unitPrice}|${record.saleDate.toISOString()}`;
      if (seen.has(key)) {
        warnings.push(
          `Duplicate record skipped: ${record.productName} on ${record.saleDate.toISOString()}`,
        );
        return false;
      }
      seen.add(key);
      return true;
    });

    // Calculate total_revenue per record & handle edge cases
    const transformedRecords = uniqueRecords.map((record) => {
      const quantity = record.quantity;
      const unitPrice = Number(record.unitPrice);
      let totalRevenue = quantity * unitPrice;

      if (quantity < 0) {
        warnings.push(`Negative quantity for ${record.productName}: ${quantity}`);
        totalRevenue = quantity * unitPrice; // Keep negative revenue (could be a return/refund)
      }

      if (unitPrice === 0) {
        warnings.push(`Zero price for ${record.productName}`);
        totalRevenue = 0;
      }

      return {
        batchId: record.batchId,
        recordId: record.id,
        productName: record.productName,
        quantity: record.quantity,
        unitPrice: record.unitPrice,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        saleDate: record.saleDate,
      };
    });

    // Store transformation results
    await prisma.transformationResult.createMany({
      data: transformedRecords,
    });

    // Aggregate daily totals per product
    const aggregateMap = new Map<
      string,
      { productName: string; saleDate: Date; totalQuantity: number; totalRevenue: number }
    >();

    for (const record of transformedRecords) {
      const key = `${record.productName}|${record.saleDate.toISOString()}`;
      const existing = aggregateMap.get(key);
      if (existing) {
        existing.totalQuantity += record.quantity;
        existing.totalRevenue += Number(record.totalRevenue);
      } else {
        aggregateMap.set(key, {
          productName: record.productName,
          saleDate: record.saleDate,
          totalQuantity: record.quantity,
          totalRevenue: Number(record.totalRevenue),
        });
      }
    }

    // Upsert daily aggregates
    for (const agg of aggregateMap.values()) {
      await prisma.dailyAggregate.upsert({
        where: {
          batchId_productName_saleDate: {
            batchId,
            productName: agg.productName,
            saleDate: agg.saleDate,
          },
        },
        create: {
          batchId,
          productName: agg.productName,
          saleDate: agg.saleDate,
          totalQuantity: agg.totalQuantity,
          totalRevenue: Number(agg.totalRevenue.toFixed(2)),
        },
        update: {
          totalQuantity: agg.totalQuantity,
          totalRevenue: Number(agg.totalRevenue.toFixed(2)),
        },
      });
    }

    // Update batch status
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'completed' },
    });

    return {
      batchId,
      recordsTransformed: transformedRecords.length,
      aggregatesCreated: aggregateMap.size,
      warnings,
    };
  } catch (error) {
    await prisma.batch.update({
      where: { id: batchId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

export async function getTransformResult(batchId: string) {
  const [results, aggregates] = await Promise.all([
    prisma.transformationResult.findMany({ where: { batchId } }),
    prisma.dailyAggregate.findMany({ where: { batchId } }),
  ]);

  if (results.length === 0 && aggregates.length === 0) {
    throw new Error('No transformation results found for batch');
  }

  return {
    batchId,
    results: results.map((r) => ({
      id: r.id,
      productName: r.productName,
      quantity: r.quantity,
      unitPrice: Number(r.unitPrice),
      totalRevenue: Number(r.totalRevenue),
      saleDate: r.saleDate.toISOString().split('T')[0],
    })),
    dailyAggregates: aggregates.map((a) => ({
      productName: a.productName,
      saleDate: a.saleDate.toISOString().split('T')[0],
      totalQuantity: a.totalQuantity,
      totalRevenue: Number(a.totalRevenue),
    })),
  };
}

export { prisma };
