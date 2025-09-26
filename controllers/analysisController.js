import { containerClient } from "../config/azureStorage.js";
import {
  processDocument,
  searchInDocument,
} from "../services/documentService.js";
import { enhancedSemanticSearch } from "../services/aiService.js";
import PDFParser from "pdf2json";

export const gapAnalysis = async (req, res) => {
  try {
    console.log("\n=== GAP ANALYSIS STARTED ===");
    console.log("Request received at:", new Date().toISOString());
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { documents, items, top_k = 3, quick_mode = false } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res
        .status(400)
        .json({
          error: "Documents array is required (use document IDs/blob names)",
        });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    // Set a timeout for the entire operation - increased to 5 minutes (300 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Request timeout after 5 minutes")),
        300000
      );
    });

    const analysisPromise = performGapAnalysis(
      documents,
      items,
      top_k,
      quick_mode
    );

    const results = await Promise.race([analysisPromise, timeoutPromise]);

    console.log(`Gap analysis completed with ${results.length} total results`);

    const finalResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k * items.length);

    res.json({
      results: finalResults,
    });
  } catch (error) {
    console.error("Gap analysis error:", error);
    res
      .status(500)
      .json({ error: "Gap analysis failed", details: error.message });
  }
};

async function performGapAnalysis(documents, items, top_k, quick_mode = false) {
  const results = [];

  for (const docId of documents) {
    try {
      // Extract filename from document ID (remove timestamp prefix)
      const filename = docId.includes("-")
        ? docId.split("-").slice(1).join("-")
        : docId;

      let documentBuffer;
      let pages;

      // Use document ID as blob name to fetch from Azure Blob Storage
      try {
        console.log(`Fetching document with ID: ${docId}`);
        const blockBlobClient = containerClient.getBlockBlobClient(docId);

        const exists = await blockBlobClient.exists();
        if (!exists) {
          throw new Error(`Document not found: ${docId}`);
        }

        // Use downloadToBuffer for more efficient download
        documentBuffer = await blockBlobClient.downloadToBuffer();
        console.log(
          `Successfully downloaded document: ${docId}, size: ${documentBuffer.length} bytes`
        );
      } catch (azureError) {
        console.error("Azure Blob Storage fetch error:", azureError);
        results.push({
          doc_id: docId,
          error: `Failed to fetch document from storage: ${azureError.message}`,
          document_id: docId,
        });
        continue;
      }

      console.log(`Processing document: ${docId}`);
      const processedDoc = await processDocument(
        documentBuffer,
        docId,
        filename
      );
      pages = processedDoc.pages;
      console.log(
        `Document processed successfully: ${docId}, pages: ${pages.length}`
      );

      // Use AI-based semantic search for each item
      console.log(`Starting AI-based semantic search for ${items.length} items...`);

      for (const item of items) {
        console.log(`\nSearching for item - Tag: "${item.tag}", Description: "${item.description}"`);

        // Call enhanced semantic search which will trigger the prompt logs
        const semanticResults = await enhancedSemanticSearch(
          pages,
          item.tag,
          item.description,
          0.3 // threshold
        );

        // Add results with proper formatting
        semanticResults.forEach(result => {
          results.push({
            doc_id: docId,
            pageno: result.page_no,
            tag: result.tag,
            description: result.description,
            score: result.score,
            method: 'semantic'
          });
        });
      }
    } catch (docError) {
      console.error(`Error processing document ${docId}:`, docError);
      results.push({
        doc_id: docId,
        error: `Error processing document: ${docError.message}`,
        document_id: docId,
      });
      continue;
    }
  }

  return results;
}

// New function to search page by page and return found tags and descriptions per page
function searchPageByPage(pages, items, docId) {
  const results = [];

  // Extract all search terms from items
  const searchTags = items.map((item) => item.tag.toLowerCase());
  const searchDescriptions = items.map((item) =>
    item.description.toLowerCase()
  );

  console.log(`Searching ${pages.length} pages for tags and descriptions...`);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageContent = page.content.toLowerCase();
    const pageNo = page.page_no || i + 1;

    // Find tags that appear on this page
    const foundTags = [];
    const foundDescriptions = [];

    for (const item of items) {
      const tag = item.tag.toLowerCase();
      const description = item.description.toLowerCase();

      // Check if tag is found on this page (exact or partial match)
      if (
        pageContent.includes(tag) ||
        tag
          .split(" ")
          .some((word) => word.length > 2 && pageContent.includes(word))
      ) {
        if (!foundTags.includes(item.tag)) {
          foundTags.push(item.tag);
        }
      }

      // Check if description keywords are found on this page
      const descriptionWords = description
        .split(" ")
        .filter((word) => word.length > 3) // Only check words longer than 3 characters
        .slice(0, 5); // Check max 5 words to avoid too many false positives

      const foundDescriptionWords = descriptionWords.filter((word) =>
        pageContent.includes(word.toLowerCase())
      );

      if (
        foundDescriptionWords.length >= Math.min(2, descriptionWords.length / 2)
      ) {
        if (!foundDescriptions.includes(item.description)) {
          foundDescriptions.push(item.description);
        }
      }
    }

    // If any tags or descriptions were found on this page, add to results
    if (foundTags.length > 0 || foundDescriptions.length > 0) {
      results.push({
        doc_id: docId,
        pageno: pageNo,
        tags: foundTags,
        descriptions: foundDescriptions,
      });

      console.log(
        `Page ${pageNo}: Found ${foundTags.length} tags, ${foundDescriptions.length} descriptions`
      );
    }
  }

  console.log(`Total pages with matches: ${results.length}`);
  return results;
}
