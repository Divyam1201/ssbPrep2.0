import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/server/auth";
import { classifyTopicsWithAI } from "@/server/services/lecturetteService";

/**
 * POST /api/lecturette/classify
 * Admin-only: batch-classifies candidate topics into the 4 tiers using AI.
 * Falls back to "moderate" if AI fails or no key configured.
 * Body: { topics: string[] }
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
    const body = await req.json();
    if (!body.topics || !Array.isArray(body.topics) || body.topics.length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body must include a non-empty 'topics' array" },
        { status: 400 },
      );
    }

    const topicNames: string[] = body.topics
      .filter((t: unknown) => typeof t === "string")
      .map((t: string) => t.trim().slice(0, 80))
      .filter(Boolean);

    if (topicNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid topic names provided" },
        { status: 400 },
      );
    }

    const result = await classifyTopicsWithAI(topicNames);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Classification failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
