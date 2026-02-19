import { PrismaClient } from '@prisma/client';
import { SalesRecord, IngestPayloadSchema } from '@mono/shared';
import { BatchStatus } from '@mono/shared';

interface BatchRow {
  id: string;
  status: string;
  recordCount: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IngestionPrismaClient {
  $disconnect(): Promise<void>;
  batch: {
    create(args: { data: { status: string; recordCount: number } }): Promise<{ id: string }>;
    update(args: {
      where: { id: string };
      data: { status: string; errorMessage?: string | null };
    }): Promise<unknown>;
    findUnique(args: { where: { id: string } }): Promise<BatchRow | null>;
  };
  rawRecord: {
    createMany(args: { data: Array<{ batchId: string; payload: object }> }): Promise<unknown>;
  };
  normalisedRecord: {
    createMany(args: {
      data: Array<{
        batchId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        saleDate: Date;
      }>;
    }): Promise<unknown>;
  };
}

const prisma = new PrismaClient() as unknown as IngestionPrismaClient;

export interface IngestResult {
  batchId: string;
  status: string;
  recordCount: number;
  errors: string[];
}

export async function ingestRecords(body: unknown): Promise<IngestResult> {
  // Validate the payload
  const records: SalesRecord[] = IngestPayloadSchema.parse(body);

  // Create a batch
  const batch = await prisma.batch.create({
    data: {
      status: BatchStatus.PROCESSING,
      recordCount: records.length,
    },
  });

  const errors: string[] = [];
  const validRecords: SalesRecord[] = [];

  // Additional business validation beyond schema
  records.forEach((record, index) => {
    if (record.quantity < 0) {
      errors.push(`Record ${index}: negative quantity (${record.quantity})`);
    }
    validRecords.push(record);
  });

  try {
    // Store raw records
    await prisma.rawRecord.createMany({
      data: records.map((record) => ({
        batchId: batch.id,
        payload: record as object,
      })),
    });

    // Store normalised records
    await prisma.normalisedRecord.createMany({
      data: validRecords.map((record) => ({
        batchId: batch.id,
        productName: record.product_name.trim(),
        quantity: record.quantity,
        unitPrice: record.unit_price,
        saleDate: new Date(record.sale_date),
      })),
    });

    // Update batch status
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.COMPLETED,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
      },
    });

    // Fire-and-forget: trigger transformation
    triggerTransformation(batch.id).catch((err) => {
      console.warn('Failed to trigger transformation:', err.message);
    });

    return {
      batchId: batch.id,
      status: BatchStatus.COMPLETED,
      recordCount: validRecords.length,
      errors,
    };
  } catch (error) {
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

export async function getBatchStatus(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new Error('Batch not found');
  }

  return {
    batchId: batch.id,
    status: batch.status,
    recordCount: batch.recordCount,
    errorMessage: batch.errorMessage,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}

async function triggerTransformation(batchId: string): Promise<void> {
  const transformationUrl = process.env.TRANSFORMATION_URL || 'http://localhost:3002';
  try {
    const response = await fetch(`${transformationUrl}/api/transform/${batchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`Transformation trigger returned ${response.status} for batch ${batchId}`);
    }
  } catch (err) {
    console.warn(`Could not reach transformation service: ${err}`);
  }
}

export { prisma };
