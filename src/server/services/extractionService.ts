export type ExtractableModule = "wat" | "srt" | "lecturette";

export interface ExtractedItemsResult {
  module: ExtractableModule;
  items: string[];
  itemCount: number;
  rawText?: string;
}

export interface IExtractionService {
  extractItems(
    fileUrl: string,
    module: ExtractableModule,
  ): Promise<ExtractedItemsResult>;
}

/**
 * Extracts practice items (words, situations, or topics) from uploaded PDFs, Word docs, or images.
 * Real AI extraction will be implemented in a subsequent phase.
 */
class ExtractionService implements IExtractionService {
  async extractItems(
    fileUrl: string,
    module: ExtractableModule,
  ): Promise<ExtractedItemsResult> {
    // TODO: Fetch uploaded document and call Claude/GPT to extract words, situations, or topics
    if (!fileUrl) {
      throw new Error("File URL is required for extraction");
    }

    return {
      module,
      items: [],
      itemCount: 0,
      rawText: "Stub: extraction not yet implemented",
    };
  }
}

export const extractionService = new ExtractionService();
