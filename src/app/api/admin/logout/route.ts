import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, verifyOrigin } from "@/server/auth";

export async function POST(req: Request) {
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  return NextResponse.json({ success: true, isAdmin: false });
}
