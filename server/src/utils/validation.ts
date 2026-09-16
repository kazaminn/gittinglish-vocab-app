import type { ZodSchema } from 'zod';
import { badRequest } from './api-error.js';

function formatPath(path: readonly PropertyKey[]) {
  if (path.length === 0) return 'body';
  return path
    .map((segment, index) =>
      typeof segment === 'number'
        ? `[${segment}]`
        : index === 0
          ? String(segment)
          : `.${String(segment)}`
    )
    .join('');
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw badRequest('INVALID_JSON', 'Request body must be valid JSON');
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue ? formatPath(issue.path) : 'body';
    const message = issue
      ? `${path}: ${issue.message}`
      : 'Invalid request body';
    throw badRequest('INVALID_REQUEST', message);
  }

  return parsed.data;
}
