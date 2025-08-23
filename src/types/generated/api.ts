// API Request and Response Types
// Generated on 2025-08-23T14:31:51.129Z

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: T;
  timeout?: number;
  withCredentials?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  message?: string;
  status: number;
  success: boolean;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  field?: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
    cursor?: string;
    nextCursor?: string;
  };
}

export interface BatchRequest<T = any> {
  operations: Array<{
    id: string;
    method: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: string;
    data: T;
  }>;
  transactional?: boolean;
}

export interface BatchResponse<T = any> {
  success: Array<{
    id: string;
    data: T;
  }>;
  failures: Array<{
    id: string;
    error: ApiError;
  }>;
  partial: boolean;
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id?: string;
  userId?: string;
  ack?: boolean;
}

export interface StreamResponse<T = any> {
  stream: ReadableStream<T>;
  cancel: () => void;
  progress?: number;
}

export interface FileUploadRequest {
  file: File | Blob;
  fileName?: string;
  mimeType?: string;
  maxSize?: number;
  allowedTypes?: string[];
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}
