import { Request } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

const attemptsMessage = {
  message: "Too many attempts, please try again later",
};

export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: attemptsMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

// express-rate-limit keys on req.ip by default. We extend the key with the
// normalized email because neither key alone is safe:
//  - IP only: every user behind one NAT/office IP shares a single bucket, so
//    a few attempts would lock out unrelated users;
//  - email only: an attacker rotating IPs could exhaust the victim's bucket
//    and DoS the victim's own logins.
// Keying by (IP, email) throttles an attacker guessing a single account
// without ever affecting other users.
function credentialKeyGenerator(req: Request): string {
  const email = (req.body?.email ?? "").toString().trim().toLowerCase();
  return `${req.ip}|${email}`;
}

// /login and /forgot-password are the only endpoints that accept raw
// credentials (a password / an email to mail a reset link to):
//  - /login is where online password guessing happens;
//  - /forgot-password lets anyone trigger mail to an arbitrary address —
//    limiting it prevents inbox flooding and cheap request spam.
// Every other endpoint is protected either by a valid session (authenticate)
// or by a high-entropy one-time token that cannot be brute-forced.
export const credentialRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: attemptsMessage,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: credentialKeyGenerator,
});
