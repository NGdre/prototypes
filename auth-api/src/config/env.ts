import dotenv from "dotenv";
dotenv.config();

// The app treats NODE_ENV === "development" as the only explicitly trusted
// environment: an unset NODE_ENV in a real deployment must NOT silently fall
// back to known default secrets (see requireJwtSecret below).
const isDevelopment = process.env.NODE_ENV === "development";

const MIN_SECRET_LENGTH = 32;

// JWT secrets sign every token this service issues; a known or weak secret
// lets an attacker forge access/refresh tokens for any user. Startup aborts
// unless a strong secret is provided:
//  - missing secret + NODE_ENV not explicitly "development" -> fail hard;
//  - missing secret in development -> known dev default;
//  - a secret that is a known default or shorter than 32 chars -> fail hard.
function requireJwtSecret(name: string, devDefault: string): string {
  const value = process.env[name];

  if (!value) {
    if (!isDevelopment) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return devDefault;
  }

  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `Insecure value for ${name}: use a random secret of at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  return value;
}

/**
 * When `trust proxy` is unset the app does NOT trust any proxy. If it runs behind a reverse
 * proxy without TRUST_PROXY set, req.ip becomes the proxy's address and the
 * rate limiter would treat every user as a single client.
 */
function parseTrustProxy(raw: string | undefined): boolean | number | string {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return 1;
  if (normalized === "false" || normalized === "0") return false;
  const hops = Number(normalized);
  if (Number.isInteger(hops) && hops > 0) return hops;
  return normalized;
}

const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);

if (process.env.NODE_ENV === "production" && !process.env.TRUST_PROXY) {
  console.warn(
    "[env] WARNING: TRUST_PROXY is not set. If this app runs behind a reverse " +
      "proxy (nginx, etc.), set TRUST_PROXY=1 so rate limiting and logs see " +
      "real client IPs instead of the proxy's IP.",
  );
}

const CLEANUP_CRON_SCHEDULE_DEFAULT = "*/5 * * * *"; // every 5 mins

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL:
    process.env.DATABASE_URL || "postgresql://localhost:5432/auth_db",
  JWT_ACCESS_SECRET: requireJwtSecret(
    "JWT_ACCESS_SECRET",
    "default-access-secret",
  ),
  JWT_REFRESH_SECRET: requireJwtSecret(
    "JWT_REFRESH_SECRET",
    "default-refresh-secret",
  ),
  TRUST_PROXY,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  PASSWORD_RESET_TOKEN_EXPIRY: process.env.PASSWORD_RESET_TOKEN_EXPIRY || "1h",
  EMAIL_VERIFY_TOKEN_EXPIRY: process.env.EMAIL_VERIFY_TOKEN_EXPIRY || "24h",
  CLEANUP_CRON_SCHEDULE:
    process.env.CLEANUP_CRON_SCHEDULE || CLEANUP_CRON_SCHEDULE_DEFAULT,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@localhost",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
};

export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match || match[1] === undefined || match[2] === undefined) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid expiry unit: ${unit}`);
  }
}
