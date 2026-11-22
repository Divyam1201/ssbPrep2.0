import { NextResponse } from "next/server";

import { verifyAdminSession } from "@/server/auth";
import {
  addTopics,
  getAllTopics,
  seedDefaultTopics,
  type LecturetteTopicPublic,
} from "@/server/services/lecturetteService";
import type { LecturetteTier } from "@/server/models/LecturetteTopic";

/**
 * GET /api/lecturette/topics
 * Public: returns all lecturette topics.
 * Pass ?seed=true on first load to idempotently seed the default 62 topics.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shouldSeed = searchParams.get("seed") === "true";

    if (shouldSeed) {
      await seedDefaultTopics();
    }

    const topics: LecturetteTopicPublic[] = await getAllTopics();
    return NextResponse.json({ success: true, topics });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch topics";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/lecturette/topics
 * Admin-only: add one or many topics.
 * Body: { topics: [{ name: string, tier?: LecturetteTier }] }
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

    // Validate each topic
    const validTiers: LecturetteTier[] = ["veasy", "easy", "moderate", "high"];
    const sanitized: Array<{ name: string; tier: LecturetteTier }> = [];

    for (const item of body.topics) {
      const name = typeof item.name === "string"
        ? item.name.trim().replace(/\s+/g, " ").slice(0, 80)
        : "";

      if (!name) {
        return NextResponse.json(
          { success: false, error: `Empty topic name found. All topics must have a name.` },
          { status: 400 },
        );
      }

      if (name.length > 80) {
        return NextResponse.json(
          { success: false, error: `Topic "${name.slice(0, 30)}…" exceeds 80 character limit` },
          { status: 400 },
        );
      }

      const tier: LecturetteTier = validTiers.includes(item.tier)
        ? item.tier
        : "moderate";

      sanitized.push({ name, tier });
    }

    const result = await addTopics({ topics: sanitized });

    return NextResponse.json(
      { success: true, ...result },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add topics";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
