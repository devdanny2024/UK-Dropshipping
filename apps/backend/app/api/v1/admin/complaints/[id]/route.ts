import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { prisma } from '../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../lib/auth';
import { createOrderEvent } from '../../../../../../lib/events';
import { sendMail } from '../../../../../../lib/mailer';
import { complaintStatusEmail } from '../../../../../../lib/emails';

const updateSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']),
  resolutionNote: z.string().optional()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, updateSchema);
  if (error) return error;

  const existing = await prisma.complaint.findUnique({
    where: { id: context.params.id },
    include: { user: true }
  });
  if (!existing) return fail('NOT_FOUND', 'Complaint not found', 404);

  const isClosed = data.status === 'RESOLVED' || data.status === 'REJECTED';

  const complaint = await prisma.complaint.update({
    where: { id: existing.id },
    data: {
      status: data.status,
      resolutionNote: data.resolutionNote ?? undefined,
      resolvedAt: isClosed ? new Date() : null,
      resolvedById: isClosed ? 'admin' : null
    }
  });

  await createOrderEvent(
    existing.orderId,
    'complaint_update',
    `Complaint ${existing.id} status set to ${data.status}` +
      (data.resolutionNote ? ` — ${data.resolutionNote}` : '')
  );

  if (existing.user?.email) {
    const mail = complaintStatusEmail(
      existing.user.name ?? '',
      existing.orderId,
      data.status,
      data.resolutionNote
    );
    await sendMail({ to: existing.user.email, ...mail });
  }

  return ok({ complaint });
}
