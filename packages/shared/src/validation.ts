import { z } from 'zod';

export const SalesRecordSchema = z.object({
  product_name: z.string().min(1, 'product_name is required'),
  quantity: z.number().int('quantity must be an integer'),
  unit_price: z.number().nonnegative('unit_price must be non-negative'),
  sale_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'sale_date must be a valid date string'),
});

export const IngestPayloadSchema = z
  .array(SalesRecordSchema)
  .min(1, 'Payload must contain at least one record');

export type SalesRecord = z.infer<typeof SalesRecordSchema>;
