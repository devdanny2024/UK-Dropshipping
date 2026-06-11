import { prisma } from './prisma';
import {
  computeServiceCharge,
  getInternationalTransferFee,
  getDomesticPostage,
  getStoreToWarehouseFee,
  getTaxUsPercent,
  getShippingRatePerKgNgn,
} from './settings';
import { calcShippingCostNgn } from './weight';
import { getFxRates, convertAmount } from './fx';

/** A single line on the draft invoice, grouped under a store. */
export type InvoiceDraftLineItem = {
  storeName: string;
  productTitle: string;
  productUrl: string;
  size: string | null;
  color: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  weightGrams: number | null;
};

/** Full computed draft — line items plus every money component. */
export type InvoiceDraft = {
  region: 'UK' | 'US';
  currency: string;
  lineItems: InvoiceDraftLineItem[];
  itemsSubtotal: number;
  storePostage: number;
  salesTax: number;
  internationalTransferFee: number;
  serviceCharge: number;
  nigeriaPostage: number;
  domesticPostage: number;
  total: number;
  /** Non-fatal flags warning the admin that one or more fee lines came out zero/missing. */
  warnings: string[];
};

/**
 * Derive a store/group key from a product URL hostname.
 * Strips a leading "www." and returns the registrable name (e.g. "amazon", "aldo").
 * Falls back to a trimmed raw string when the URL cannot be parsed.
 */
export function storeNameFromUrl(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    host = (url || '').trim();
  }
  host = host.replace(/^www\./i, '').toLowerCase();
  const parts = host.split('.').filter(Boolean);
  if (parts.length === 0) return host || 'unknown';
  // Registrable name: second-to-last label (e.g. amazon.co.uk -> amazon, aldo.com -> aldo).
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build a deterministic DRAFT invoice from an order's items.
 * Groups line items by store, then computes every money component per the M2 R2/R14 rules.
 */
export async function buildInvoiceDraft(orderId: string): Promise<InvoiceDraft> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { productSnapshot: true } } },
  });
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const region = order.region as 'UK' | 'US';
  const currency = order.currency;

  const lineItems: InvoiceDraftLineItem[] = order.items.map((item) => {
    const snap = item.productSnapshot;
    return {
      storeName: storeNameFromUrl(snap.url),
      productTitle: snap.title,
      productUrl: snap.url,
      size: item.size || null,
      color: item.color || null,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.total,
      weightGrams: item.chargeableWeightGrams ?? null,
    };
  });

  const itemsSubtotal = round2(lineItems.reduce((sum, li) => sum + li.lineTotal, 0));

  // Store → warehouse postage: sum per distinct store (0 when not configured).
  const distinctStores = Array.from(new Set(lineItems.map((li) => li.storeName)));
  const storeFees = await Promise.all(distinctStores.map((s) => getStoreToWarehouseFee(s)));
  const storePostage = round2(storeFees.reduce((sum, f) => sum + (f?.fee ?? 0), 0));
  const storesMissingFee = distinctStores.filter((_, i) => !storeFees[i] || (storeFees[i]?.fee ?? 0) <= 0);

  // US sales tax only.
  let salesTax = 0;
  if (region === 'US') {
    const pct = await getTaxUsPercent();
    salesTax = round2((itemsSubtotal * pct) / 100);
  }

  const [internationalTransferFee, serviceCharge, domesticPostage] = await Promise.all([
    getInternationalTransferFee(),
    computeServiceCharge(region, itemsSubtotal),
    getDomesticPostage(),
  ]);

  // Nigeria postage: per item, use the admin manual override when set (already
  // in order currency), else derive from chargeable weight (priced in NGN, then
  // FX-converted to the order currency). Items with neither contribute 0.
  let fxConversionFailed = false;
  const ratePerKgNgn = await getShippingRatePerKgNgn();
  let nigeriaPostage = 0;
  for (const item of order.items) {
    if (item.manualDeliveryPrice != null) {
      nigeriaPostage += item.manualDeliveryPrice;
    } else if (item.chargeableWeightGrams != null) {
      const ngn = calcShippingCostNgn(item.chargeableWeightGrams * item.qty, ratePerKgNgn);
      try {
        const { rates } = await getFxRates('NGN', [currency]);
        const rate = rates[currency.toUpperCase()];
        if (!rate || !Number.isFinite(rate)) throw new Error('missing rate');
        nigeriaPostage += convertAmount(ngn, rate);
      } catch {
        fxConversionFailed = true;
      }
    }
  }
  nigeriaPostage = round2(nigeriaPostage);

  const total = round2(
    itemsSubtotal +
      storePostage +
      salesTax +
      internationalTransferFee +
      serviceCharge +
      nigeriaPostage +
      domesticPostage,
  );

  // Flag zero/missing fee lines so the admin can correct them before sending.
  const warnings: string[] = [];
  if (fxConversionFailed) {
    warnings.push('Could not FX-convert weight-based Nigeria postage — set a per-item delivery price.');
  }
  if (nigeriaPostage === 0) {
    warnings.push('Nigeria postage is 0 — set a per-item delivery price.');
  }
  if (storesMissingFee.length > 0) {
    warnings.push(
      `No store→warehouse fee configured for: ${storesMissingFee.join(', ')}.`,
    );
  }
  if (serviceCharge === 0 && region === 'US') {
    warnings.push('Service charge is 0 — check the US service-charge config.');
  }
  if (internationalTransferFee === 0) {
    warnings.push('International transfer fee is 0 — check settings.');
  }

  return {
    region,
    currency,
    lineItems,
    itemsSubtotal,
    storePostage,
    salesTax,
    internationalTransferFee: round2(internationalTransferFee),
    serviceCharge: round2(serviceCharge),
    nigeriaPostage,
    domesticPostage: round2(domesticPostage),
    total,
    warnings,
  };
}
