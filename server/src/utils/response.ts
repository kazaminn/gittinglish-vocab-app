import type { ApiResponse } from '../../../shared/dto.js';

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function err(code: string, message: string): ApiResponse<never> {
  return { ok: false, error: { code, message } };
}
