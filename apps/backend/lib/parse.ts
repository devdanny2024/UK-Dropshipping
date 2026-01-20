import type { ZodSchema } from 'zod';
import { fail } from './response';
import type { NextRequest } from 'next/server';

export async function parseBody<T>(request: NextRequest, schema: ZodSchema<T>) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { error: fail('INVALID_JSON', 'Request body must be valid JSON', 400) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { error: fail('VALIDATION_ERROR', result.error.message, 422) };
  }
  return { data: result.data };
}
