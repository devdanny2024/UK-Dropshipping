import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { requireAdmin } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const key = String(body?.key ?? '').trim();
  const value = String(body?.value ?? '').trim();

  if (!key) return fail('INVALID_INPUT', 'key is required', 400);

  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return ok({ key, value });
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const settings = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  return ok({ settings });
}
