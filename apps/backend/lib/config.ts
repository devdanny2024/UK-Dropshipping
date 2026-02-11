import { z } from 'zod';

const configSchema = z.object({
  FLW_SECRET_KEY: z.string().min(10),
  FLW_PUBLIC_KEY: z.string().min(10).optional(),
  FLW_WEBHOOK_SECRET_HASH: z.string().min(6),
  FLW_REDIRECT_URL: z.string().url()
});

export function getFlutterwaveConfig() {
  return configSchema.parse(process.env);
}
