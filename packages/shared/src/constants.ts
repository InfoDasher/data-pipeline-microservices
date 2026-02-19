export enum BatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const SERVICE_PORTS = {
  INGESTION: 3001,
  TRANSFORMATION: 3002,
  REPORTING: 3003,
} as const;
