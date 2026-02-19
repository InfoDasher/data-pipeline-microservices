import { Router, Request, Response } from 'express';
import { transformBatch, getTransformResult } from '../services/transformService';

const router = Router();

/**
 * POST /api/transform/:batchId
 * Triggers transformation for a batch.
 */
router.post('/:batchId', async (req: Request, res: Response) => {
  const result = await transformBatch(String(req.params.batchId));
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/transform/result/:batchId
 * Returns transformed/aggregated data for a batch.
 */
router.get('/result/:batchId', async (req: Request, res: Response) => {
  const result = await getTransformResult(String(req.params.batchId));
  res.json({
    success: true,
    data: result,
  });
});

export default router;
