import { z } from "zod";

/**
 * Runtime environment, validated once at boot.
 *
 * OPENROUTER_API_KEY is deliberately optional: the card routes degrade to a
 * curated mock deck when it is absent, so a missing key is a downgrade rather
 * than a crash. Everything else has a sane local default.
 */
/**
 * A blank line in `.env` (`OPENROUTER_API_KEY=`) reaches us as `""`, not as
 * absent — so `.optional()` alone would reject it and `.default()` would not
 * apply. Since `.env.example` ships the key blank on purpose, treat empty and
 * whitespace-only values as "not set".
 */
const blankAsUnset = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema,
  );

const EnvSchema = z.object({
  OPENROUTER_API_KEY: blankAsUnset(z.string().min(1).optional()),
  OPENROUTER_MODEL: blankAsUnset(
    z.string().min(1).default("google/gemma-4-26b-a4b-it:free"),
  ),
  /** Sent as OpenRouter's attribution headers; purely cosmetic on their side. */
  OPENROUTER_SITE_URL: blankAsUnset(
    z.string().min(1).default("http://localhost:3000"),
  ),
  OPENROUTER_APP_NAME: blankAsUnset(z.string().min(1).default("Zero-Aura")),
  PORT: blankAsUnset(z.coerce.number().int().positive().default(4000)),
  CORS_ORIGIN: blankAsUnset(
    z.string().min(1).default("http://localhost:3000"),
  ),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment configuration:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;

/** True when we have credentials to actually call OpenRouter. */
export const isAiEnabled = Boolean(env.OPENROUTER_API_KEY);
