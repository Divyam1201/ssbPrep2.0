import { UTApi } from "uploadthing/server";

import { connectToDatabase } from "../db";
import {
  SetModel,
  type ISet,
  type ISetFile,
  type ModuleType,
  type SetClassification,
} from "../models/Set";
import { tatImageValidator } from "./tatImageValidator";

export type { ModuleType, SetClassification };


export const utapi = new UTApi();

export const MODULE_MAX_ITEMS: Partial<Record<ModuleType, number>> = {
  tat: 11,
  wat: 60,
  srt: 60,
  lecturette: 4,
  // gd has no max defined yet
};

export interface CreateSetInput {
  module: ModuleType;
  name: string;
  files?: ISetFile[];
  words?: string[];
  itemCount?: number;
}

export function computeSetClassification(
  module: ModuleType,
  itemCount: number,
): {
  maxItems?: number;
  isComplete?: boolean;
  setType?: SetClassification;
} {
  const max = MODULE_MAX_ITEMS[module];
  if (max === undefined) {
    return {
      maxItems: undefined,
      isComplete: undefined,
      setType: undefined,
    };
  }

  const isComplete = itemCount >= max;
  return {
    maxItems: max,
    isComplete,
    setType: isComplete ? "Complete Set" : "Partial Set",
  };
}

function isValidUploadThingKey(key: string): boolean {
  if (typeof key !== "string" || key.trim().length === 0) return false;
  return /^[a-zA-Z0-9_\-.]+$/.test(key);
}

function isValidUploadThingUrl(url: string): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "ufs.sh" ||
        parsed.hostname.endsWith(".ufs.sh") ||
        parsed.hostname === "utfs.io" ||
        parsed.hostname.endsWith(".utfs.io") ||
        parsed.hostname.endsWith(".uploadthing.com"))
    );
  } catch {
    return false;
  }
}

export async function createSet(input: CreateSetInput): Promise<ISet> {
  const { module, name, files } = input;
  const fileKeys = files?.map((f) => f.key).filter(Boolean) || [];

  const cleanupOrphanedFiles = async () => {
    if (fileKeys.length > 0) {
      try {
        await utapi.deleteFiles(fileKeys);
      } catch (err) {
        console.error("Failed to delete orphaned UploadThing files:", err);
      }
    }
  };

  // 1. Validate module name
  const validModules: ModuleType[] = ["tat", "wat", "srt", "lecturette", "gd"];
  if (!validModules.includes(module)) {
    await cleanupOrphanedFiles();
    throw new Error(
      `Invalid module: "${module}". Must be one of: ${validModules.join(", ")}`,
    );
  }

  // 2. Validate set name
  const trimmedName = name?.trim();
  if (!trimmedName) {
    await cleanupOrphanedFiles();
    throw new Error("Set name is required");
  }

  // 3. Validate contents (files or words)
  const isWatWordsSet =
    module === "wat" && Array.isArray(input.words) && input.words.length > 0;

  let validatedWords: string[] = [];

  if (isWatWordsSet) {
    validatedWords = input.words!
      .map((w) => String(w).trim())
      .filter((w) => w.length > 0);

    if (validatedWords.length === 0) {
      await cleanupOrphanedFiles();
      throw new Error("At least one word is required for WAT set");
    }

    if (validatedWords.length > MODULE_MAX_ITEMS.wat!) {
      await cleanupOrphanedFiles();
      throw new Error(
        `WAT sets cannot exceed ${MODULE_MAX_ITEMS.wat} words (received ${validatedWords.length})`,
      );
    }
  } else {
    // 3b. Validate files array for file-based sets
    if (!Array.isArray(files) || files.length === 0) {
      await cleanupOrphanedFiles();
      throw new Error("At least one uploaded file is required");
    }

    // 4. Validate per-module file count limits
    if (module === "tat") {
      const maxTat = MODULE_MAX_ITEMS.tat!;
      if (files.length > maxTat) {
        await cleanupOrphanedFiles();
        throw new Error(
          `TAT sets cannot exceed ${maxTat} images (received ${files.length})`,
        );
      }
    } else {
      // WAT, SRT, Lecturette, GD use a single uploaded material document
      if (files.length !== 1) {
        await cleanupOrphanedFiles();
        throw new Error(
          `${module.toUpperCase()} source material must be exactly 1 file`,
        );
      }
    }

    // 5. Validate file keys and URLs belong to UploadThing
    for (const file of files) {
      if (!isValidUploadThingKey(file.key)) {
        await cleanupOrphanedFiles();
        throw new Error(`Invalid UploadThing file key: "${file.key}"`);
      }
      if (!isValidUploadThingUrl(file.url)) {
        await cleanupOrphanedFiles();
        throw new Error(`Invalid UploadThing file URL: "${file.url}"`);
      }
    }

    // 6. Pre-validation checks (e.g. TAT blank image validator)
    if (module === "tat") {
      const validation = await tatImageValidator.validateImages(files);
      if (!validation.allValid) {
        await cleanupOrphanedFiles();
        throw new Error(
          "One or more uploaded images failed validation (blank or invalid)",
        );
      }
    }
  }

  // 7. Calculate item count & set classification
  const finalItemCount = isWatWordsSet
    ? validatedWords.length
    : typeof input.itemCount === "number" && input.itemCount > 0
      ? input.itemCount
      : (files?.length ?? 0);

  const classification = computeSetClassification(module, finalItemCount);

  // 8. Save set to MongoDB
  try {
    await connectToDatabase();

    const createdSet = await SetModel.create({
      module,
      name: trimmedName,
      files: (files || []).map((f) => ({
        key: f.key,
        url: f.url,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
      })),
      words: validatedWords,
      itemCount: finalItemCount,
      maxItems: classification.maxItems,
      isComplete: classification.isComplete,
      setType: classification.setType,
    });

    return createdSet;
  } catch (error) {
    await cleanupOrphanedFiles();
    throw error;
  }
}

export interface GetRecentSetsInput {
  module: ModuleType;
  limit?: number;
}

export interface PublicRecentSet {
  id: string;
  name: string;
  module: ModuleType;
  itemCount: number;
  maxItems?: number;
  isComplete?: boolean;
  setType?: SetClassification;
  words?: string[];
  files: Array<{
    key: string;
    url: string;
    name?: string;
    size?: number;
  }>;
  createdAt: Date;
}

export async function getRecentSets(
  input: GetRecentSetsInput,
): Promise<PublicRecentSet[]> {
  const validModules: ModuleType[] = ["tat", "wat", "srt", "lecturette", "gd"];
  if (!validModules.includes(input.module)) {
    throw new Error(
      `Invalid module: "${input.module}". Must be one of: ${validModules.join(", ")}`,
    );
  }

  const limit = Math.min(Math.max(1, input.limit || 20), 50);

  await connectToDatabase();

  const sets = await SetModel.find({ module: input.module })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return sets.map((s) => ({
    id: s._id.toString(),
    name: s.name,
    module: s.module,
    itemCount: s.itemCount,
    maxItems: s.maxItems,
    isComplete: s.isComplete,
    setType: s.setType,
    words: s.words || [],
    files: (s.files || []).map((f) => ({
      key: f.key,
      url: f.url,
      name: f.name,
      size: f.size,
    })),
    createdAt: s.createdAt,
  }));
}
