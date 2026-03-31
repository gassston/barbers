import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ROOT_USER: z.string(),
  MINIO_ROOT_PASSWORD: z.string(),
  MINIO_BUCKET: z.string().default("barbers"),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  WEB_URL: z.string().url().default("http://localhost:3000"),

  CANCELLATION_HOURS_LIMIT: z.coerce.number().default(24),
  DEPOSIT_AMOUNT_ARS: z.coerce.number().default(1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
