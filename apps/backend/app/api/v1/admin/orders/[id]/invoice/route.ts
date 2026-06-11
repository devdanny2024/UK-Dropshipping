import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { prisma } from '../../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../../lib/auth';
import { buildInvoiceDraft } from '../../../../../../../lib/invoice';
import { createOrderEvent } from '../../../../../../../lib/events';
import { orderHasUnresolvedWeight } from '../../../../../../../lib/weight-request';

function shortId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const orderId = context.params.id;
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: { lineItems: true },
  });
  if (!invoice) return fail('NOT_FOUND', 'Invoice not found', 404);

  return ok({ invoice });
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const orderId = context.params.id;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail('NOT_FOUND', 'Order not found', 404);

  const existing = await prisma.invoice.findUnique({
    where: { orderId },
    include: { lineItems: true },
  });
  if (existing) return fail('ALREADY_EXISTS', 'Invoice already exists for this order', 409);

  if (await orderHasUnresolvedWeight(orderId)) {
    return fail('WEIGHT_PENDING', 'Resolve all weight-price requests before invoicing', 409);
  }

  const draft = await buildInvoiceDraft(orderId);

  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      invoiceNumber: `INV-${shortId()}`,
      region: draft.region,
      currency: draft.currency,
      status: 'DRAFT',
      itemsSubtotal: draft.itemsSubtotal,
      storePostage: draft.storePostage,
      salesTax: draft.salesTax,
      internationalTransferFee: draft.internationalTransferFee,
      serviceCharge: draft.serviceCharge,
      nigeriaPostage: draft.nigeriaPostage,
      domesticPostage: draft.domesticPostage,
      total: draft.total,
      lineItems: {
        create: draft.lineItems.map((li) => ({
          storeName: li.storeName,
          productTitle: li.productTitle,
          productUrl: li.productUrl,
          size: li.size,
          color: li.color,
          qty: li.qty,
          unitPrice: li.unitPrice,
          lineTotal: li.lineTotal,
          weightGrams: li.weightGrams,
        })),
      },
    },
    include: { lineItems: true },
  });

  await prisma.order.update({ where: { id: orderId }, data: { status: 'PENDING_INVOICE' } });
  await createOrderEvent(orderId, 'INVOICE_DRAFTED', `Invoice ${invoice.invoiceNumber} drafted`);

  return ok({ invoice });
}

const patchLineItemSchema = z.object({
  storeName: z.string(),
  productTitle: z.string(),
  productUrl: z.string(),
  size: z.string().nullish(),
  color: z.string().nullish(),
  qty: z.number().int().min(1),
  unitPrice: z.number(),
  lineTotal: z.number().optional(),
  weightGrams: z.number().int().nullish(),
});

const patchSchema = z.object({
  lineItems: z.array(patchLineItemSchema).optional(),
  storePostage: z.number().optional(),
  salesTax: z.number().optional(),
  internationalTransferFee: z.number().optional(),
  serviceCharge: z.number().optional(),
  nigeriaPostage: z.number().optional(),
  domesticPostage: z.number().optional(),
  notes: z.string().nullish(),
});

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const orderId = context.params.id;

  const { data, error } = await parseBody(request, patchSchema);
  if (error) return error;

  const existing = await prisma.invoice.findUnique({
    where: { orderId },
    include: { lineItems: true },
  });
  if (!existing) return fail('NOT_FOUND', 'Invoice not found', 404);

  // Resolve effective line items (edited set replaces existing, else keep current).
  const effectiveLineItems = data.lineItems
    ? data.lineItems.map((li) => ({
        storeName: li.storeName,
        productTitle: li.productTitle,
        productUrl: li.productUrl,
        size: li.size ?? null,
        color: li.color ?? null,
        qty: li.qty,
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal ?? round2(li.unitPrice * li.qty),
        weightGrams: li.weightGrams ?? null,
      }))
    : existing.lineItems.map((li) => ({
        storeName: li.storeName,
        productTitle: li.productTitle,
        productUrl: li.productUrl,
        size: li.size,
        color: li.color,
        qty: li.qty,
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal,
        weightGrams: li.weightGrams,
      }));

  const itemsSubtotal = round2(effectiveLineItems.reduce((sum, li) => sum + li.lineTotal, 0));
  const storePostage = data.storePostage ?? existing.storePostage;
  const salesTax = data.salesTax ?? existing.salesTax;
  const internationalTransferFee = data.internationalTransferFee ?? existing.internationalTransferFee;
  const serviceCharge = data.serviceCharge ?? existing.serviceCharge;
  const nigeriaPostage = data.nigeriaPostage ?? existing.nigeriaPostage;
  const domesticPostage = data.domesticPostage ?? existing.domesticPostage;

  const total = round2(
    itemsSubtotal +
      storePostage +
      salesTax +
      internationalTransferFee +
      serviceCharge +
      nigeriaPostage +
      domesticPostage,
  );

  const invoice = await prisma.$transaction(async (tx) => {
    if (data.lineItems) {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: existing.id } });
      await tx.invoiceLineItem.createMany({
        data: effectiveLineItems.map((li) => ({
          invoiceId: existing.id,
          storeName: li.storeName,
          productTitle: li.productTitle,
          productUrl: li.productUrl,
          size: li.size,
          color: li.color,
          qty: li.qty,
          unitPrice: li.unitPrice,
          lineTotal: li.lineTotal,
          weightGrams: li.weightGrams,
        })),
      });
    }

    return tx.invoice.update({
      where: { id: existing.id },
      data: {
        itemsSubtotal,
        storePostage,
        salesTax,
        internationalTransferFee,
        serviceCharge,
        nigeriaPostage,
        domesticPostage,
        total,
        notes: data.notes ?? undefined,
      },
      include: { lineItems: true },
    });
  });

  return ok({ invoice });
}
