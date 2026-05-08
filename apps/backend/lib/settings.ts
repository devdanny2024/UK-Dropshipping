import { prisma } from './prisma';

const PLATFORM_FEE_KEY = 'platform_fee_percent';
const FX_OVERRIDE_PREFIX = 'fx_override_';

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
