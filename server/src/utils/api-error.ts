type ApiStatus = 400 | 401 | 404 | 409 | 500;

export class ApiError extends Error {
  readonly status: ApiStatus;
  readonly code: string;

  constructor(status: ApiStatus, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function badRequest(code: string, message: string) {
  return new ApiError(400, code, message);
}

export function unauthorized(message = 'Unauthorized') {
  return new ApiError(401, 'UNAUTHORIZED', message);
}

export function notFound(code: string, message: string) {
  return new ApiError(404, code, message);
}

export function conflict(code: string, message: string) {
  return new ApiError(409, code, message);
}

export function internal(message = 'Internal server error') {
  return new ApiError(500, 'INTERNAL', message);
}
