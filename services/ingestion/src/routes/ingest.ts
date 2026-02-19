import { Router, Request, Response } from 'express';
import { ingestRecords, getBatchStatus } from '../services/ingestService';

const router = Router();

/**
 * POST /api/ingest
 * Accepts a JSON array of sales records, validates, stores raw + normalised data.
 */
router.post('/', async (req: Request, res: Response) => {
  const result = await ingestRecords(req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/ingest/status/:batchId
 * Returns processing status of a batch.
 */
router.get('/status/:batchId', async (req: Request, res: Response) => {
  const result = await getBatchStatus(String(req.params.batchId));
  res.json({
    success: true,
    data: result,
  });
});

export default router;
