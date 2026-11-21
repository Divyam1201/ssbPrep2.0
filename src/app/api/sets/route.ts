import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/server/auth";
import {
  createSet,
  getRecentSets,
  type CreateSetInput,
  type ModuleType,
} from "@/server/services/setService";

/**
 * Public GET: Fetches recent public sets for a module (no auth required).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetModule = searchParams.get("module") as ModuleType | null;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;

    if (!targetModule) {
      return NextResponse.json(
        { success: false, error: "Missing required 'module' query parameter" },
        { status: 400 },
      );
    }

    const sets = await getRecentSets({ module: targetModule, limit });
    return NextResponse.json({ success: true, sets });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sets";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}

/**
 * Admin POST: Creates a new shared set in MongoDB (Admin auth required).
 */
export async function POST(req: Request) {
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Admin access required" },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as CreateSetInput;
    const newSet = await createSet(body);
    return NextResponse.json({ success: true, set: newSet }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create set";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
