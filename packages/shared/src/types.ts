export interface BatchResponse {
  batchId: string;
  status: string;
  recordCount: number;
  errors?: string[];
}

export interface TransformResult {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  saleDate: string;
}

export interface DailyAggregate {
  productName: string;
  saleDate: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: string;
}

export interface HealthStatus {
  service: string;
  status: 'up' | 'down';
  timestamp: string;
}
