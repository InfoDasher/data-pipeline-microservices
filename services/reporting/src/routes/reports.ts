import { Router, Request, Response } from 'express';
import { getSummary, getProductBreakdown, checkServicesHealth } from '../services/reportService';

const router = Router();

/**
 * GET /api/reports/summary?from=&to=&page=&limit=
 * Returns aggregated sales summary with optional date-range filtering and pagination.
 */
router.get('/summary', async (req: Request, res: Response) => {
  const result = await getSummary({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  });

  res.json({
    success: true,
    data: result.summary,
    dailyBreakdown: result.dailyBreakdown,
    meta: result.meta,
  });
});

/**
 * GET /api/reports/products?from=&to=&page=&limit=
 * Returns per-product breakdown.
 */
router.get('/products', async (req: Request, res: Response) => {
  const result = await getProductBreakdown({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  });

  res.json({
    success: true,
    data: result.products,
    meta: result.meta,
  });
});

/**
 * GET /api/reports/health
 * Returns health status of all services.
 */
router.get('/health', async (_req: Request, res: Response) => {
  const result = await checkServicesHealth();
  res.json({
    success: true,
    data: result.services,
  });
});

export default router;
