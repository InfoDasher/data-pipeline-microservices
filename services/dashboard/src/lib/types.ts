// API types matching the backend response shapes

export interface SummaryData {
  totalRevenue: number;
  totalQuantity: number;
  recordCount: number;
}

export interface DailyBreakdown {
  productName: string;
  saleDate: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SummaryResponse {
  success: boolean;
  data: SummaryData;
  dailyBreakdown: DailyBreakdown[];
  meta: PaginationMeta;
}

export interface Product {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  daysActive: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: PaginationMeta;
}

export interface ServiceHealth {
  service: string;
  status: 'up' | 'down';
  timestamp: string;
}

export interface HealthResponse {
  success: boolean;
  data: ServiceHealth[];
}

export interface BatchResult {
  batchId: string;
  status: string;
  recordCount: number;
  errors: string[];
}

export interface IngestResponse {
  success: boolean;
  data: BatchResult;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}
