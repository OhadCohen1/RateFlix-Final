interface ApiResponse<T> {
  success: boolean;
  error?: object | string;
  data?: T;
  timestamp: string;
}

export function buildSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function buildErrorResponse<T>(error: object | unknown): ApiResponse<T> {
  return {
    success: false,
    error: (error as object | string) ?? 'Server Error',
    timestamp: new Date().toISOString(),
  };
}
