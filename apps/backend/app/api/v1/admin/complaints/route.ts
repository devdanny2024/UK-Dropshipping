import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';
import type { ComplaintStatus, Prisma } from '@prisma/client';

const VALID_STATUSES: ComplaintStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const statusParam = request.nextUrl.searchParams.get('status');
  const where: Prisma.ComplaintWhereInput = {};
  if (statusParam && VALID_STATUSES.includes(statusParam as ComplaintStatus)) {
    where.status = statusParam as ComplaintStatus;
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      order: { select: { id: true } },
      user: { select: { email: true } }
    }
  });

  return ok({ complaints });
}
