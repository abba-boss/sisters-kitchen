import { logger } from "../utils/logger";

/**
 * Secrets that must be explicit in every deployed environment. Locally we fall
 * back to obvious development values so `npm run dev` works out of the box, but
 * production refuses to boot without them.
 */
const REQUIRED_SECRETS = ["JWT_SECRET", "JWT_REFRESH_SECRET"] as const;

const DEV_FALLBACKS: Record<string, string> = {
  JWT_SECRET: "dev-only-jwt-secret-do-not-use-in-production",
  JWT_REFRESH_SECRET: "dev-only-refresh-secret-do-not-use-in-production",
};

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = REQUIRED_SECRETS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (isProduction) {
      // Fail at boot instead of on the first login attempt.
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}. ` +
          "Set them in the deployment environment before starting the API."
      );
    }

    missing.forEach((key) => {
      process.env[key] = DEV_FALLBACKS[key];
    });
    logger.warn(
      `⚠️  Missing ${missing.join(", ")} — using development defaults. Set them in backend/.env before deploying.`
    );
  }

  if (isProduction && process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    logger.warn("⚠️  JWT_SECRET and JWT_REFRESH_SECRET are identical — use different values.");
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    logger.warn("⚠️  PAYSTACK_SECRET_KEY is not set — online payment is disabled (cash on delivery still works).");
  }
}
