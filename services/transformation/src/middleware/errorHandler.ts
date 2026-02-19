import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err.message);

  if (
    err.message === 'Batch not found' ||
    err.message === 'No transformation results found for batch'
  ) {
    res.status(404).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err.message === 'No records found for batch') {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
