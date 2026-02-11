import { prisma } from './prisma';

const PLATFORM_FEE_KEY = 'platform_fee_percent';

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
