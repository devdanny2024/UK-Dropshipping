import { prisma } from './prisma';
import type { DeliveryConfig } from './delivery-engine';

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

// --- Delivery Engine config (M2 R6) — admin-editable, no redeploy ---

const DELIVERY_DEFAULTS: DeliveryConfig = {
  processingDays: 1,
  leg1StdMin: 3,
  leg1StdMax: 5,
  leg1ExpressMin: 1,
  leg1ExpressMax: 2,
  despatchWeekday: 4, // Thursday
  despatchCutoffDays: 1, // at hub by Wednesday
  leg2StdMin: 5,
  leg2StdMax: 10,
  leg2ExpressMin: 2,
  leg2ExpressMax: 3,
  expressRegions: ['UK'],
};

const DELIVERY_KEYS: Record<keyof Omit<DeliveryConfig, 'expressRegions'>, string> = {
  processingDays: 'delivery_processing_days',
  leg1StdMin: 'delivery_leg1_std_min',
  leg1StdMax: 'delivery_leg1_std_max',
  leg1ExpressMin: 'delivery_leg1_express_min',
  leg1ExpressMax: 'delivery_leg1_express_max',
  despatchWeekday: 'delivery_despatch_weekday',
  despatchCutoffDays: 'delivery_despatch_cutoff_days',
  leg2StdMin: 'delivery_leg2_std_min',
  leg2StdMax: 'delivery_leg2_std_max',
  leg2ExpressMin: 'delivery_leg2_express_min',
  leg2ExpressMax: 'delivery_leg2_express_max',
};
const DELIVERY_EXPRESS_REGIONS_KEY = 'delivery_express_regions';

export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { startsWith: 'delivery_' } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: string, fallback: number) => {
    const v = Number(map.get(key));
    return Number.isFinite(v) ? v : fallback;
  };
  const config: DeliveryConfig = { ...DELIVERY_DEFAULTS };
  (Object.keys(DELIVERY_KEYS) as Array<keyof typeof DELIVERY_KEYS>).forEach((field) => {
    config[field] = num(DELIVERY_KEYS[field], DELIVERY_DEFAULTS[field]);
  });
  const regions = map.get(DELIVERY_EXPRESS_REGIONS_KEY);
  config.expressRegions = regions
    ? regions.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : DELIVERY_DEFAULTS.expressRegions;
  return config;
}

export async function setDeliverySetting(field: keyof DeliveryConfig, value: number | string[]) {
  if (field === 'expressRegions') {
    const csv = Array.isArray(value) ? value.join(',') : String(value);
    await prisma.appSetting.upsert({
      where: { key: DELIVERY_EXPRESS_REGIONS_KEY },
      update: { value: csv },
      create: { key: DELIVERY_EXPRESS_REGIONS_KEY, value: csv },
    });
    return;
  }
  const key = DELIVERY_KEYS[field];
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
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

// --- Region service charge (M2 R2) — US has a minimum, UK has none ---
// Defaults to 0 until admin sets real figures (call mentioned "$15 when under $150").
export async function getServiceChargeUsConfig(): Promise<{ min: number; threshold: number }> {
  const [min, threshold] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'service_charge_us_min' } }),
    prisma.appSetting.findUnique({ where: { key: 'service_charge_us_threshold' } }),
  ]);
  return {
    min: min ? Number(min.value) || 0 : 0,
    threshold: threshold ? Number(threshold.value) || 0 : 0,
  };
}
export async function setServiceChargeUs(field: 'min' | 'threshold', value: number) {
  const key = field === 'min' ? 'service_charge_us_min' : 'service_charge_us_threshold';
  await prisma.appSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
}
/** Region-specific service charge: US applies a flat minimum when order value is below the threshold; UK is always 0. */
export async function computeServiceCharge(region: 'UK' | 'US', orderValue: number): Promise<number> {
  if (region !== 'US') return 0;
  const { min, threshold } = await getServiceChargeUsConfig();
  if (min <= 0) return 0;
  return orderValue < threshold ? min : 0;
}

// --- International transfer fee (M2) ---
export async function getInternationalTransferFee(): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: 'international_transfer_fee' } });
  const v = s ? Number(s.value) : 0;
  return Number.isFinite(v) ? v : 0;
}
export async function setInternationalTransferFee(fee: number) {
  await prisma.appSetting.upsert({ where: { key: 'international_transfer_fee' }, update: { value: String(fee) }, create: { key: 'international_transfer_fee', value: String(fee) } });
}

// --- Domestic (Lagos → outside) postage (M2) ---
export async function getDomesticPostage(): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: 'domestic_postage' } });
  const v = s ? Number(s.value) : 0;
  return Number.isFinite(v) ? v : 0;
}
export async function setDomesticPostage(fee: number) {
  await prisma.appSetting.upsert({ where: { key: 'domestic_postage' }, update: { value: String(fee) }, create: { key: 'domestic_postage', value: String(fee) } });
}

// --- Store → warehouse delivery fee (M3 R14) — per store, from AdapterState ---
export async function getStoreToWarehouseFee(storeName: string): Promise<{ fee: number; currency: string | null } | null> {
  const needle = storeName.trim().toLowerCase();
  if (!needle) return null;
  const stores = await prisma.adapterState.findMany({
    select: { name: true, domain: true, storeToWarehouseFee: true, storeFeeCurrency: true },
  });
  const match = stores.find(
    (s) => s.name.toLowerCase() === needle || s.domain.toLowerCase().includes(needle) || needle.includes(s.name.toLowerCase()),
  );
  if (!match || match.storeToWarehouseFee == null) return null;
  return { fee: match.storeToWarehouseFee, currency: match.storeFeeCurrency };
}
export async function setStoreToWarehouseFee(adapterId: string, fee: number, currency: string) {
  await prisma.adapterState.update({
    where: { id: adapterId },
    data: { storeToWarehouseFee: fee, storeFeeCurrency: currency },
  });
}
