import { type ApiResponse } from '@shared/dto';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.ok) {
    const message = payload.ok
      ? `HTTP ${response.status}`
      : payload.error.message;
    const code = payload.ok ? 'HTTP_ERROR' : payload.error.code;
    throw new ApiClientError(message, code, response.status);
  }

  return payload.data;
}
