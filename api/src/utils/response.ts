import type { ApiResponse } from '@gittinglish-vocab-app/shared';

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function err(code: string, message: string): ApiResponse<never> {
  return { ok: false, error: { code, message } };
}
