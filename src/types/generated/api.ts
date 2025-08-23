// API Request and Response Types
// Generated on 2025-08-23T08:05:43.743Z

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: T
  timeout?: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
  message?: string
  status: number
  success: boolean
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  stack?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface BatchRequest<T = any> {
  operations: Array<{
    id: string
    method: 'CREATE' | 'UPDATE' | 'DELETE'
    data: T
  }>
}

export interface BatchResponse<T = any> {
  success: Array<{
    id: string
    data: T
  }>
  failures: Array<{
    id: string
    error: ApiError
  }>
}

export interface WebSocketMessage<T = any> {
  type: string
  payload: T
  timestamp: string
  id?: string
}

export interface StreamResponse<T = any> {
  stream: ReadableStream<T>
  cancel: () => void
}