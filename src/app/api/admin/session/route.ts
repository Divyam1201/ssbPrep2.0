import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/server/auth";

export async function GET(req: Request) {
  const isAdmin = await verifyAdminSession(req);
  return NextResponse.json({ isAdmin });
}
