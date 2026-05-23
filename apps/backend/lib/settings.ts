import { prisma } from './prisma';

const PLATFORM_FEE_KEY = 'platform_fee_percent';
const FX_OVERRIDE_PREFIX = 'fx_override_';
const SHIPPING_RATE_KEY = 'shipping_rate_per_kg_ngn';
const DEFAULT_SHIPPING_RATE_NGN = 800;

export async function getPlatformFeePercent() {
  const setting = await prisma.appSetting.findUnique({ where: { key: PLATFORM_FEE_KEY } });
  const value = setting ? Number(setting.value) : 5;
  return Number.isFinite(value) ? value : 5;
}

export async function setPlatformFeePercent(feePercent: number) {
  await prisma.appSetting.upsert({
    where: { key: PLATFORM_FEE_KEY },
    update: { value: String(feePercent) },
    create: { key: PLATFORM_FEE_KEY, value: String(feePercent) }
  });
}

export async function getFxOverride(pair: string): Promise<number | null> {
  const key = `${FX_OVERRIDE_PREFIX}${pair.toUpperCase()}`;
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  if (!setting) return null;
  const value = Number(setting.value);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function setFxOverride(pair: string, rate: number) {
  const key = `${FX_OVERRIDE_PREFIX}${pair.toUpperCase()}`;
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: String(rate) },
    create: { key, value: String(rate) }
  });
}

export async function deleteFxOverride(pair: string) {
  const key = `${FX_OVERRIDE_PREFIX}${pair.toUpperCase()}`;
  await prisma.appSetting.deleteMany({ where: { key } });
}

export async function getShippingRatePerKgNgn(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({ where: { key: SHIPPING_RATE_KEY } });
  const value = setting ? Number(setting.value) : DEFAULT_SHIPPING_RATE_NGN;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SHIPPING_RATE_NGN;
}

export async function setShippingRatePerKgNgn(rate: number) {
  await prisma.appSetting.upsert({
    where: { key: SHIPPING_RATE_KEY },
    update: { value: String(rate) },
    create: { key: SHIPPING_RATE_KEY, value: String(rate) }
  });
}

// --- Tax ---
export async function getTaxUsPercent(): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: 'tax_us_percent' } });
  const v = s ? Number(s.value) : 0;
  return Number.isFinite(v) ? v : 0;
}
export async function setTaxUsPercent(pct: number) {
  await prisma.appSetting.upsert({ where: { key: 'tax_us_percent' }, update: { value: String(pct) }, create: { key: 'tax_us_percent', value: String(pct) } });
}

// --- Logistic fee (GBP) ---
export async function getLogisticFeeGbp(): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: 'logistic_fee_gbp' } });
  const v = s ? Number(s.value) : 0;
  return Number.isFinite(v) ? v : 0;
}
export async function setLogisticFeeGbp(fee: number) {
  await prisma.appSetting.upsert({ where: { key: 'logistic_fee_gbp' }, update: { value: String(fee) }, create: { key: 'logistic_fee_gbp', value: String(fee) } });
}

// --- Delivery fees (door / pickup) ---
export async function getDeliveryFees(): Promise<{ door: number; pickup: number }> {
  const [door, pickup] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'delivery_fee_door' } }),
    prisma.appSetting.findUnique({ where: { key: 'delivery_fee_pickup' } }),
  ]);
  return { door: door ? Number(door.value) : 0, pickup: pickup ? Number(pickup.value) : 0 };
}
export async function setDeliveryFee(type: 'door' | 'pickup', fee: number) {
  const key = type === 'door' ? 'delivery_fee_door' : 'delivery_fee_pickup';
  await prisma.appSetting.upsert({ where: { key }, update: { value: String(fee) }, create: { key, value: String(fee) } });
}

// --- Weight rate per kg (GBP) ---
export async function getWeightRatePerKg(): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: 'weight_rate_per_kg_gbp' } });
  const v = s ? Number(s.value) : 0;
  return Number.isFinite(v) ? v : 0;
}
export async function setWeightRatePerKg(rate: number) {
  await prisma.appSetting.upsert({ where: { key: 'weight_rate_per_kg_gbp' }, update: { value: String(rate) }, create: { key: 'weight_rate_per_kg_gbp', value: String(rate) } });
}

export async function getAllFxOverrides(): Promise<Record<string, number>> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { startsWith: FX_OVERRIDE_PREFIX } }
  });
  const result: Record<string, number> = {};
  for (const row of rows) {
    const pair = row.key.slice(FX_OVERRIDE_PREFIX.length);
    const value = Number(row.value);
    if (Number.isFinite(value) && value > 0) result[pair] = value;
  }
  return result;
}
