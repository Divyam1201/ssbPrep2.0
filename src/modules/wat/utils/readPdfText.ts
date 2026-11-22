import * as pdfjsLib from "pdfjs-dist";

// Configure pdfjs worker for client-side Next.js execution
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

/**
 * Reads all selectable text from an uploaded PDF file on the client.
 * Does not upload or store the PDF anywhere.
 *
 * Throws a descriptive error if the PDF contains no extractable text layer.
 */
export async function readPdfText(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
): Promise<string> {
  const data =
    fileOrBuffer instanceof File
      ? await fileOrBuffer.arrayBuffer()
      : fileOrBuffer;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings: string[] = [];

    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string") {
        strings.push(item.str);
        if ("hasEOL" in item && item.hasEOL) {
          strings.push("\n");
        }
      }
    }

    const pageText = strings.join(" ");
    if (pageText.trim()) {
      pageTexts.push(pageText);
    }
  }

  const fullText = pageTexts.join("\n").trim();
  if (!fullText) {
    throw new Error(
      "This PDF has no selectable text. Please upload a text-based PDF or paste the words manually.",
    );
  }

  return fullText;
}
