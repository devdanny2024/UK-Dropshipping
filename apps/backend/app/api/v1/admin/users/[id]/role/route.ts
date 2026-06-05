import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { prisma } from '../../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../../lib/auth';

const roleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'])
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, roleSchema);
  if (error) return error;

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return fail('NOT_FOUND', 'User not found', 404);

  const isAdminRole = (role: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Guard: never demote the last remaining admin/super-admin.
  if (isAdminRole(existing.role) && !isAdminRole(data.role)) {
    const adminCount = await prisma.user.count({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });
    if (adminCount <= 1) {
      return fail('LAST_ADMIN', 'Cannot remove the last admin', 400);
    }
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { role: data.role, roleUpdatedAt: new Date() }
  });

  return ok({ user: { id: user.id, email: user.email, role: user.role } });
}
