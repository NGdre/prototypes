import crypto from "crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function compareToken(token: string, hash: string): boolean {
  const computedHash = crypto.createHash("sha256").update(token).digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  // length check is required before timingSafeEqual, which throws on mismatched buffers.
  if (hashBuffer.length !== computedBuffer.length) {
    return false;
  }
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(hashBuffer, computedBuffer);
}
