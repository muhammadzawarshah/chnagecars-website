import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const csv = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

/**
 * Every environment variable the backend reads. Validated once at boot so a
 * misconfigured instance fails fast instead of failing on the first request.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('api/v1'),
  APP_NAME: z.string().default('ChangeCars'),
  /** Public site URL, used in emails (reset links, unsubscribe links). */
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: csv.default(['http://localhost:3000']),
  /** Express "trust proxy" setting: number of proxy hops (Nginx/LB/CDN) in front of the API. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SWAGGER_ENABLED: bool.default(true),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(20),
  /** Optional read-replica URL for heavy public reads (search, listings). */
  DATABASE_READ_URL: z.string().optional(),

  /** Optional. Without Redis the API falls back to per-process memory (single-instance dev only). */
  REDIS_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  /**
   * Shared secret between the Next.js website server and this API. When a request carries it
   * (X-Web-Adapter-Key), the throttler keys on X-Web-Client-Ip (the shopper) instead of the web server IP.
   */
  /**
   * The website's refresh endpoint (e.g. https://www.changecars.co.za/api/revalidate). When set, public
   * data changes refresh the website's cached pages at once instead of after their cache expires.
   */
  WEB_REVALIDATE_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  WEB_ADAPTER_KEY: z.string().min(32, 'WEB_ADAPTER_KEY must be at least 32 characters').optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('af-south-1'),
  S3_BUCKET: z.string().default('changecars-media'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: bool.default(false),
  /** Public base URL for media (CDN in front of the bucket). */
  MEDIA_PUBLIC_BASE_URL: z.string().default('http://localhost:9000/changecars-media'),
  MEDIA_MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(15 * 1024 * 1024),
  MEDIA_MAX_IMAGES_PER_VEHICLE: z.coerce.number().int().positive().default(40),

  MAIL_FROM: z.string().default('ChangeCars <no-reply@changecars.co.za>'),
  /** smtp://user:pass@host:587 — when empty, emails are written to the log instead. */
  SMTP_URL: z.string().optional(),
  /** "log" until a real SMS gateway is integrated. */
  SMS_PROVIDER: z.enum(['log']).default('log'),

  /** Run the outbox dispatcher and scheduled jobs inside the API process (dev convenience). */
  RUN_WORKER_IN_API: bool.default(false),
  WORKER_OUTBOX_BATCH: z.coerce.number().int().positive().default(50),
  WORKER_OUTBOX_POLL_MS: z.coerce.number().int().positive().default(1000),

  RESERVATION_HOLD_HOURS: z.coerce.number().int().positive().default(72),
  BIDDING_MAX_DURATION_HOURS: z.coerce.number().int().positive().default(168),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  // The example values in .env.example are public; refuse to run production with them.
  if (parsed.data.NODE_ENV === 'production') {
    const placeholders = (['JWT_ACCESS_SECRET', 'WEB_ADAPTER_KEY'] as const).filter((key) => parsed.data[key]?.includes('change-me'));
    if (placeholders.length) {
      throw new Error(`Invalid environment configuration:\n${placeholders.map((key) => `  - ${key}: still the example value; set a long random secret`).join('\n')}`);
    }
  }
  return parsed.data;
}
