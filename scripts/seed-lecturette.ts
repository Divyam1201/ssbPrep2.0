/**
 * Idempotent seed script for lecturette topics.
 * Run with: npx tsx scripts/seed-lecturette.ts
 */
import { seedDefaultTopics } from "../src/server/services/lecturetteService";
import { connectToDatabase } from "../src/server/db";

async function main() {
  console.log("Connecting to database...");
  await connectToDatabase();

  console.log("Seeding default lecturette topics (idempotent)...");
  const result = await seedDefaultTopics();

  console.log(`Inserted: ${result.inserted.length} topics`);
  if (result.inserted.length > 0) {
    for (const name of result.inserted) {
      console.log(`  + ${name}`);
    }
  }

  console.log(`Skipped (already exist): ${result.skipped.length} topics`);
  if (result.skipped.length > 0) {
    for (const name of result.skipped) {
      console.log(`  ~ ${name}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
