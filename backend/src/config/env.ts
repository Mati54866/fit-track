import "dotenv/config";

import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
  COOKIE_SECURE: booleanFromString.optional(),
  CLIENT_ID: z.string().min(1, "CLIENT_ID is required"),
  CLIENT_SECRET: z.string().min(1, "CLIENT_SECRET is required"),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default("http://localhost:5000/api/v1/auth/google/callback"),
  CLOUD_NAME: z.string().min(1, "CLOUD_NAME is required"),
  CLOUD_API_KEY: z.string().min(1, "CLOUD_API_KEY is required"),
  CLOUD_API_SECRET: z.string().min(1, "CLOUD_API_SECRET is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = {
  ...parsedEnv.data,
  COOKIE_SECURE:
    parsedEnv.data.COOKIE_SECURE ?? parsedEnv.data.NODE_ENV === "production",
};

if (env.COOKIE_SAME_SITE === "none" && !env.COOKIE_SECURE) {
  throw new Error("COOKIE_SAME_SITE=none requires COOKIE_SECURE=true");
}
