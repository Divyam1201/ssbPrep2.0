import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import { connectToDatabase } from "./db";
import { LoginAttemptModel } from "./models/LoginAttempt";

export const ADMIN_COOKIE_NAME = "ssb_admin_session";
const MAX_LOGIN_ATTEMPTS = 5;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    // Fallback for development/testing
    return new TextEncoder().encode("ssb-prep-default-session-secret-change-in-prod");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Constant-time string equality check to prevent timing attacks.
 * Uses SHA-256 digest to ensure identical buffer lengths before timingSafeEqual.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Verifies the Origin header against the Host header for CSRF protection.
 */
export function verifyOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // Non-CORS or same-origin direct request

  const host = req.headers.get("host");
  if (!host) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Creates a signed JWT token for the admin with a 7-day expiration.
 */
export async function createAdminToken(): Promise<string> {
  const secret = getSessionSecret();
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verifies a JWT token's signature and claims.
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Extracts the admin session token from a Request header or Next.js cookies().
 */
export async function getAdminToken(req?: Request): Promise<string | undefined> {
  if (req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(
        new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`),
      );
      if (match) return match[1];
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token) return token;
  } catch {
    // Outside request context
  }

  return undefined;
}

/**
 * Verifies whether the incoming request is authenticated as the admin.
 */
export async function verifyAdminSession(req?: Request): Promise<boolean> {
  const token = await getAdminToken(req);
  if (!token) return false;
  return verifyAdminToken(token);
}

/**
 * Asserts that the request has a valid admin session.
 * Throws an Error if unauthorized.
 */
export async function requireAdmin(req?: Request): Promise<void> {
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    const err = new Error("Unauthorized: Admin access required");
    // @ts-expect-error adding status code
    err.statusCode = 401;
    throw err;
  }
}

/**
 * Checks if an IP has exceeded the allowed failed login attempts.
 */
export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const attempts = await LoginAttemptModel.countDocuments({ ip });
    return attempts < MAX_LOGIN_ATTEMPTS;
  } catch (err) {
    console.error("Rate limit check error:", err);
    return true; // Fail open if DB is unreachable to avoid lockouts
  }
}

/**
 * Records a failed login attempt for an IP.
 */
export async function recordFailedLoginAttempt(ip: string): Promise<void> {
  try {
    await connectToDatabase();
    await LoginAttemptModel.create({ ip, createdAt: new Date() });
  } catch (err) {
    console.error("Failed to record login attempt:", err);
  }
}

/**
 * Resets failed login attempts for an IP upon successful login.
 */
export async function resetLoginAttempts(ip: string): Promise<void> {
  try {
    await connectToDatabase();
    await LoginAttemptModel.deleteMany({ ip });
  } catch (err) {
    console.error("Failed to reset login attempts:", err);
  }
}

/**
 * Validates admin credentials against environment variables.
 */
export async function validateAdminCredentials(
  email?: string,
  password?: string,
): Promise<boolean> {
  const envEmail = process.env.ADMIN_EMAIL;
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  if (!envEmail || !envHash || !email || !password) {
    return false;
  }

  const isEmailMatch = timingSafeEqualString(email.trim().toLowerCase(), envEmail.trim().toLowerCase());
  const isPasswordMatch = await bcrypt.compare(password, envHash);

  return isEmailMatch && isPasswordMatch;
}
