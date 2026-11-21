import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  checkLoginRateLimit,
  createAdminToken,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  validateAdminCredentials,
  verifyOrigin,
} from "@/server/auth";

export async function POST(req: Request) {
  // 1. Verify Origin
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // 2. Client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 3. Rate limiting check (5 attempts per 15 minutes)
  const isAllowed = await checkLoginRateLimit(ip);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const { email, password } = body;

  // 4. Validate credentials
  const isValid = await validateAdminCredentials(email, password);

  if (!isValid) {
    await recordFailedLoginAttempt(ip);
    // Generic error: never reveal which field failed
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  // 5. Successful login: clear attempt history and set cookie
  await resetLoginAttempts(ip);

  const token = await createAdminToken();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return NextResponse.json({ success: true, isAdmin: true });
}
