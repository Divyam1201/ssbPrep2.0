import { connectToDatabase } from "../db";
import {
  LecturetteTopicModel,
  type LecturetteTier,
} from "../models/LecturetteTopic";

export interface LecturetteTopicPublic {
  id: string;
  name: string;
  tier: LecturetteTier;
}

/**
 * Fetch all lecturette topics from MongoDB.
 */
export async function getAllTopics(): Promise<LecturetteTopicPublic[]> {
  await connectToDatabase();
  const topics = await LecturetteTopicModel.find({})
    .sort({ createdAt: 1 })
    .lean();

  return topics.map((t) => ({
    id: (t._id as unknown as { toString(): string }).toString(),
    name: t.name,
    tier: t.tier,
  }));
}

export type TopicInputTier = LecturetteTier | "not_sure";

export interface AddTopicsInput {
  topics: Array<{ name: string; tier: TopicInputTier }>;
}

export interface AddTopicsResult {
  inserted: string[];
  skipped: string[];
  aiFallback?: boolean;
  warning?: string;
}

/**
 * Batch-classifies topic names into one of the 4 tiers using OpenAI.
 * If API fails or key is missing, falls back to "moderate" with a warning.
 */
export async function classifyTopicsWithAI(
  topicNames: string[],
): Promise<{
  classifications: Array<{ name: string; tier: LecturetteTier }>;
  aiFallback: boolean;
  warning?: string;
}> {
  const fallbackResult = {
    classifications: topicNames.map((name) => ({
      name,
      tier: "moderate" as LecturetteTier,
    })),
    aiFallback: true,
    warning: "AI classification unavailable; defaulted to Moderate.",
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || topicNames.length === 0) {
    return fallbackResult;
  }

  try {
    const prompt = `You are an expert Services Selection Board (SSB) assessor classifying Lecturette topics into 4 difficulty tiers:
- "veasy" (Very Easy): General, familiar, or lifestyle topics (e.g., My Favourite Actor, Swachh Bharat, Pollution, Digital India)
- "easy" (Easy): Common national initiatives or widely known socio-economic topics (e.g., Organic Farming, Role of Media, Women Empowerment, Startup Culture)
- "moderate" (Moderate): Contemporary tech, legal, or specialized governance topics (e.g., Artificial Intelligence, Cyber Security, Data Privacy, Brain Drain, Disaster Management)
- "high" (High): Geopolitics, defense, international relations, complex policy, or national security topics (e.g., BRICS, CPEC, Drone Warfare, Indo-US Relations, Article 370, DRDO, India-China Relations)

Classify each of the following topics into exactly one of: "veasy", "easy", "moderate", "high".

Topics:
${topicNames.map((t, idx) => `${idx + 1}. ${t}`).join("\n")}

Respond ONLY with a JSON object in this exact format:
{
  "classifications": [
    { "name": "<topic name>", "tier": "veasy" | "easy" | "moderate" | "high" }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert SSB assessor. Output only valid JSON matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackResult;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackResult;
    }

    const parsed = JSON.parse(content) as {
      classifications?: Array<{ name: string; tier: string }>;
    };

    if (!Array.isArray(parsed.classifications)) {
      return fallbackResult;
    }

    const validTiers: LecturetteTier[] = ["veasy", "easy", "moderate", "high"];
    const classifications = topicNames.map((name) => {
      const match = parsed.classifications?.find(
        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      const tier = match && validTiers.includes(match.tier as LecturetteTier)
        ? (match.tier as LecturetteTier)
        : ("moderate" as LecturetteTier);

      return { name, tier };
    });

    return {
      classifications,
      aiFallback: false,
    };
  } catch {
    return fallbackResult;
  }
}

/**
 * Add one or many topics. Skips duplicates (case-insensitive).
 * Handles AI classification for "not_sure" tiers.
 */
export async function addTopics(
  input: AddTopicsInput,
): Promise<AddTopicsResult> {
  await connectToDatabase();

  const inserted: string[] = [];
  const skipped: string[] = [];

  // Group topics needing AI classification
  const unclassifiedNames = input.topics
    .filter((t) => t.tier === "not_sure")
    .map((t) => t.name.trim().replace(/\s+/g, " ").slice(0, 80))
    .filter(Boolean);

  let aiMap: Map<string, LecturetteTier> = new Map();
  let aiFallbackOccurred = false;
  let aiWarning: string | undefined;

  if (unclassifiedNames.length > 0) {
    const aiResult = await classifyTopicsWithAI(unclassifiedNames);
    aiFallbackOccurred = aiResult.aiFallback;
    aiWarning = aiResult.warning;
    aiMap = new Map(
      aiResult.classifications.map((c) => [c.name.toLowerCase(), c.tier]),
    );
  }

  const validTiers: LecturetteTier[] = ["veasy", "easy", "moderate", "high"];

  for (const item of input.topics) {
    const name = item.name
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);

    if (!name) continue;

    const nameLower = name.toLowerCase();
    let tier: LecturetteTier = "moderate";

    if (item.tier === "not_sure") {
      tier = aiMap.get(nameLower) ?? "moderate";
    } else if (validTiers.includes(item.tier)) {
      tier = item.tier;
    }

    try {
      await LecturetteTopicModel.create({ name, nameLower, tier });
      inserted.push(name);
    } catch (err: unknown) {
      // Duplicate key error (code 11000)
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        skipped.push(name);
      } else {
        throw err;
      }
    }
  }

  return {
    inserted,
    skipped,
    aiFallback: aiFallbackOccurred ? true : undefined,
    warning: aiWarning,
  };
}

/**
 * Idempotent seed of the original 62 topics. Safe to re-run.
 */
export async function seedDefaultTopics(): Promise<AddTopicsResult> {
  const SEED_TOPICS: Array<{ name: string; tier: LecturetteTier }> = [
    // veasy (16)
    { name: "My Favourite Actor", tier: "veasy" },
    { name: "Podcast", tier: "veasy" },
    { name: "E-Books", tier: "veasy" },
    { name: "OTT Platforms", tier: "veasy" },
    { name: "Co-Education", tier: "veasy" },
    { name: "Leadership Qualities", tier: "veasy" },
    { name: "Information is Power", tier: "veasy" },
    { name: "Swachh Bharat Abhiyan", tier: "veasy" },
    { name: "Role of Youth in Nation Building", tier: "veasy" },
    { name: "Mental Health Awareness", tier: "veasy" },
    { name: "Pollution", tier: "veasy" },
    { name: "Digital India", tier: "veasy" },
    { name: "Illiteracy", tier: "veasy" },
    { name: "Rural Development", tier: "veasy" },
    { name: "Indian Railways", tier: "veasy" },
    { name: "Skill Development", tier: "veasy" },

    // easy (15)
    { name: "Organic Farming", tier: "easy" },
    { name: "Role of Media", tier: "easy" },
    { name: "Women Empowerment", tier: "easy" },
    { name: "Make in India", tier: "easy" },
    { name: "Covid Vaccine", tier: "easy" },
    { name: "Information Technology", tier: "easy" },
    { name: "Startup Culture", tier: "easy" },
    { name: "Transportation in India", tier: "easy" },
    { name: "Ayushman Bharat", tier: "easy" },
    { name: "Corruption in India", tier: "easy" },
    { name: "Technology in Agriculture & Start-ups", tier: "easy" },
    { name: "Smart Cities", tier: "easy" },
    { name: "Renewable Energy", tier: "easy" },
    { name: "National Integration", tier: "easy" },
    { name: "Population Problem", tier: "easy" },

    // moderate (15)
    { name: "Artificial Intelligence", tier: "moderate" },
    { name: "Deep Fake", tier: "moderate" },
    { name: "Women in Defence", tier: "moderate" },
    { name: "Cyber Security", tier: "moderate" },
    { name: "Migration", tier: "moderate" },
    { name: "Data Privacy", tier: "moderate" },
    { name: "Population: Asset or Liability", tier: "moderate" },
    { name: "Right to Information (RTI)", tier: "moderate" },
    { name: "Brain Drain", tier: "moderate" },
    { name: "Cybercrime", tier: "moderate" },
    { name: "Disaster Management", tier: "moderate" },
    { name: "Dark Web", tier: "moderate" },
    { name: "Media Ethics", tier: "moderate" },
    { name: "UGC", tier: "moderate" },
    { name: "Information Explosion", tier: "moderate" },

    // high (16)
    { name: "BRICS", tier: "high" },
    { name: "CPEC", tier: "high" },
    { name: "Defence Modernisation", tier: "high" },
    { name: "Drone Warfare", tier: "high" },
    { name: "Indo-US Relations", tier: "high" },
    { name: "Article 370", tier: "high" },
    { name: "Space Warfare", tier: "high" },
    { name: "DRDO", tier: "high" },
    { name: "India-China Relations", tier: "high" },
    { name: "Terrorism – A Global Threat", tier: "high" },
    { name: "Reservation", tier: "high" },
    { name: "Compulsory Military Training", tier: "high" },
    { name: "Internal Security", tier: "high" },
    { name: "Role of Armed Forces", tier: "high" },
    { name: "Space Technology", tier: "high" },
    { name: "Drone Technology", tier: "high" },
  ];

  return addTopics({ topics: SEED_TOPICS });
}