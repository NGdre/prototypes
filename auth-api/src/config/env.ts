import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string, devDefault: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return devDefault;
}

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL:
    process.env.DATABASE_URL || "postgresql://localhost:5432/auth_db",
  JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET", "default-access-secret"),
  JWT_REFRESH_SECRET: requireEnv(
    "JWT_REFRESH_SECRET",
    "default-refresh-secret",
  ),
  TRUST_PROXY: process.env.TRUST_PROXY || "0",
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  PASSWORD_RESET_TOKEN_EXPIRY: process.env.PASSWORD_RESET_TOKEN_EXPIRY || "1h",
  EMAIL_VERIFY_TOKEN_EXPIRY: process.env.EMAIL_VERIFY_TOKEN_EXPIRY || "24h",
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
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

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
