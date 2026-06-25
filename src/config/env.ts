import { z } from "zod";

/**
 * Server-side environment variables.
 * Never import this file into client components — use `env.client` (env.mjs)
 * pattern is intentionally avoided here in favor of a single validated
 * source of truth that is only ever imported on the server.
 */
const serverEnvSchema = z.object({
  // ---- Runtime -----------------------------------------------------------
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ---- App -----------------------------------------------------------
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),

  // ---- MongoDB ------------------------------------------------------------
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .regex(
      /^mongodb(\+srv)?:\/\//,
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),

  // ---- Auth.js v5 -----------------------------------------------------------
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long")
    .refine(
      (s) => s !== "replace-with-a-32-plus-character-random-string",
      "AUTH_SECRET must not be the placeholder value from .env.example",
    ),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z
    .enum(["true", "false"])
    .default("true")
    .transform((val) => val === "true"),

  // OAuth providers (optional — enable as needed)
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // ---- Rate limiting --------------------------------------------------------
  // Optional shared secret for signing rate-limit bypass tokens
  // (e.g. for trusted internal services). Leave unset in standard deployments.
  RATE_LIMIT_SECRET: z.string().min(32).optional(),

  // ---- Stripe -----------------------------------------------------------
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required")
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required")
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required")
    .startsWith(
      "pk_",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_",
    ),

  // ---- Cloudinary -----------------------------------------------------------
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates `process.env` against the schema above and throws a single,
 * readable error listing every problem at once (rather than failing on
 * the first missing variable), so misconfiguration is obvious in CI/CD
 * and on Render at boot time.
 */
function validateEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\n` +
        "Check your .env.local file against .env.example and try again.\n",
    );
  }

  return parsed.data;
}

/**
 * Validated, type-safe environment variables.
 * Import this anywhere on the server instead of touching `process.env`
 * directly, e.g. `import { env } from "@/config/env"`.
 */
export const env = validateEnv();
