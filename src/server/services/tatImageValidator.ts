export interface TatImageValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface ITatImageValidator {
  validateImage(
    fileUrl: string,
    fileKey: string,
  ): Promise<TatImageValidationResult>;
  validateImages(
    files: Array<{ url: string; key: string }>,
  ): Promise<{
    allValid: boolean;
    results: Map<string, TatImageValidationResult>;
  }>;
}

/**
 * Validates uploaded TAT images to reject blank or invalid submissions.
 * Real AI/vision check using Claude or GPT API will be implemented in a subsequent phase.
 */
class TatImageValidator implements ITatImageValidator {
  async validateImage(
    fileUrl: string,
    fileKey: string,
  ): Promise<TatImageValidationResult> {
    // TODO: Call Claude/GPT Vision API to verify the image is not blank, corrupted, or irrelevant
    if (!fileUrl || !fileKey) {
      return { isValid: false, reason: "Missing image URL or key" };
    }

    return { isValid: true };
  }

  async validateImages(
    files: Array<{ url: string; key: string }>,
  ): Promise<{
    allValid: boolean;
    results: Map<string, TatImageValidationResult>;
  }> {
    const results = new Map<string, TatImageValidationResult>();
    let allValid = true;

    for (const file of files) {
      // TODO: Perform concurrent checks with error boundary / rate-limiting
      const res = await this.validateImage(file.url, file.key);
      results.set(file.key, res);
      if (!res.isValid) {
        allValid = false;
      }
    }

    return { allValid, results };
  }
}

export const tatImageValidator = new TatImageValidator();
