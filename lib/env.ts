import "server-only";
import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  THREADS_APP_ID: optionalString,
  THREADS_APP_SECRET: optionalString,
  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.preprocess(
    (value) => (value === "" || value === undefined ? "gemini-2.5-flash-lite" : value),
    z.string().min(1),
  ),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  THREADS_APP_ID: process.env.THREADS_APP_ID,
  THREADS_APP_SECRET: process.env.THREADS_APP_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;

export function requireThreadsEnv() {
  if (!env.THREADS_APP_ID || !env.THREADS_APP_SECRET) {
    throw new Error("THREADS_APP_ID and THREADS_APP_SECRET are required.");
  }
  return {
    appId: env.THREADS_APP_ID,
    appSecret: env.THREADS_APP_SECRET,
    redirectUri: `${env.NEXT_PUBLIC_APP_URL}/api/oauth/threads/callback`,
  };
}

export function requireSupabaseEnv() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
