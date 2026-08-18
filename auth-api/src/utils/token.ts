import crypto from "crypto";

export type SecureToken = string & { readonly __brand: "SecureToken" };
export type TokenHash = string & { readonly __brand: "TokenHash" };

export function generateSecureToken(): SecureToken {
  return crypto.randomBytes(32).toString("hex") as SecureToken;
}

export function hashToken(token: string): TokenHash {
  return crypto.createHash("sha256").update(token).digest("hex") as TokenHash;
}

export function compareToken(token: string, hash: TokenHash): boolean {
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
