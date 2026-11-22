import { connectToDatabase } from "../db";
import {
  LecturetteTopicModel,
  type ILecturetteTopic,
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

export interface AddTopicsInput {
  topics: Array<{ name: string; tier: LecturetteTier }>;
}

export interface AddTopicsResult {
  inserted: string[];
  skipped: string[];
}

/**
 * Add one or many topics. Skips duplicates (case-insensitive).
 */
export async function addTopics(
  input: AddTopicsInput,
): Promise<AddTopicsResult> {
  await connectToDatabase();

  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const item of input.topics) {
    const name = item.name
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);

    if (!name) continue;

    const nameLower = name.toLowerCase();
    const validTiers: LecturetteTier[] = ["veasy", "easy", "moderate", "high"];
    const tier = validTiers.includes(item.tier) ? item.tier : "moderate";

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

  return { inserted, skipped };
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
