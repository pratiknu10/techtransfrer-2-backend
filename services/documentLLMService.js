import axios from "axios";
import azureBlobService from "./azureBlobService.js";
import * as prompts from "../prompts/prompts.js";
import { processDocument } from "./documentService.js";

class DocumentLLMService {
  constructor() {
    console.log("🔑 ===== OPENAI API KEY VALIDATION =====");
    console.log("Environment variables check:");
    console.log("  NODE_ENV:", process.env.NODE_ENV);

    this.apiKey = process.env.OPENAI_API_KEY;
    console.log("  OPENAI_API_KEY exists:", !!this.apiKey);
    console.log("  OPENAI_API_KEY length:", this.apiKey?.length || 0);
    console.log(
      "  OPENAI_API_KEY starts with 'sk-':",
      this.apiKey?.startsWith("sk-") || false
    );
    console.log(
      "  OPENAI_API_KEY preview:",
      this.apiKey
        ? `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(
            this.apiKey.length - 4
          )}`
        : "NOT FOUND"
    );

    if (!this.apiKey) {
      console.error(
        "❌ ERROR: OPENAI_API_KEY is not set in environment variables!"
      );
      throw new Error(
        "OPENAI_API_KEY is required but not found in environment variables"
      );
    }

    if (!this.apiKey.startsWith("sk-")) {
      console.error(
        "❌ ERROR: OPENAI_API_KEY does not appear to be valid (should start with 'sk-')"
      );
      throw new Error("Invalid OPENAI_API_KEY format");
    }

    this.apiUrl = "https://api.openai.com/v1/chat/completions";
    this.model = process.env.LLM_MODEL || "gpt-4-turbo";
    this.maxTokens = parseInt(process.env.MAX_TOKENS || "4000");
    this.temperature = parseFloat(process.env.TEMPERATURE || "0.2");
    this.pageSize = 10; // Process 10 pages at a time
    this.apiCallCounter = 0; // Track number of API calls

    console.log("✅ OpenAI configuration validated successfully");
    console.log("🔑 ===== END API KEY VALIDATION =====");
  }

  // Get system prompt based on extraction type
  getSystemPrompt(extractionType, templateId, context) {
    const promptMappings = {
      CAT_01:
        "You are an advanced extraction assistant specializing in technical documents. You're tasked with extracting process definitions, CPP/CQA parameters from technical documentation related to end-to-end process descriptions and flows.",
      process_definition:
        "You are an advanced extraction assistant specializing in technical documents. You're tasked with extracting process definitions, CPP/CQA parameters from technical documentation related to end-to-end process descriptions and flows.",
    };

    // Add context if provided
    let prompt = promptMappings[extractionType] || promptMappings["CAT_01"];
    if (context) {
      prompt += ` Additional context: ${context}`;
    }

    return prompt;
  }

  // Get message template based on extraction type
  getMessageTemplate(extractionType) {
    const templates = {
      CAT_01: prompts.CAT_01,
      process_definition: prompts.CAT_01,
    };

    return templates[extractionType] || templates["CAT_01"];
  }

  // Process document with UAHBTDRS tracking
  async processDocument(documentContent, extractionType, options = {}) {
    const {
      templateId = 1,
      context = "",
      startPage = 1,
      endPage = null,
      continueFromUAHBTDRS = null,
    } = options;

    try {
      // Log the complete document content first
      console.log("📄 ===== COMPLETE DOCUMENT CONTENT (RAW) =====");
      console.log(
        "Document content length:",
        documentContent.length,
        "characters"
      );
      console.log("📖 FULL DOCUMENT TEXT (RAW):");
      console.log("=".repeat(80));
      console.log(documentContent);
      console.log("=".repeat(80));
      console.log("📄 ===== END OF RAW DOCUMENT CONTENT =====");

      // Clean the document content
      console.log("🧹 ===== CLEANING DOCUMENT CONTENT =====");
      const cleanedContent = this.cleanDocumentContent(documentContent);
      console.log(
        "Cleaned content length:",
        cleanedContent.length,
        "characters"
      );
      console.log("📖 CLEANED DOCUMENT TEXT:");
      console.log("=".repeat(80));
      console.log(cleanedContent);
      console.log("=".repeat(80));
      console.log("🧹 ===== END OF CLEANED DOCUMENT CONTENT =====");

      // Use cleaned content for processing
      documentContent = cleanedContent;

      // Parse document content into pages (assuming it's already paginated)
      console.log("\n📄 Document Pagination:");
      console.log(
        "  Document content length:",
        documentContent.length,
        "characters"
      );

      const pages = this.paginateContent(documentContent);
      console.log("  Total pages after pagination:", pages.length);

      const totalPages = pages.length;
      const processEndPage = endPage || totalPages;

      console.log("  startPage:", startPage);
      console.log("  endPage:", endPage);
      console.log("  processEndPage:", processEndPage);
      console.log("  Pages to process:", processEndPage - startPage + 1);

      // UAHBTDRS Code Management - UAHBTDRS will match page numbers
      console.log("📊 UAHBTDRS Code Management:");
      console.log(
        "  UAHBTDRS will be set to match page numbers (Page 1 = UAHBTDRS 1, Page 2 = UAHBTDRS 2, etc.)"
      );

      const results = [];
      const systemPrompt = this.getSystemPrompt(
        extractionType,
        templateId,
        context
      );
      const messageTemplate = this.getMessageTemplate(extractionType);

      // Process pages in batches of 10 with sequential UAHBTDRS/page numbers
      console.log("🔄 Starting batch processing (10 pages per batch)...");
      const batchSize = 10;

      for (
        let pageIndex = startPage - 1;
        pageIndex < processEndPage;
        pageIndex += batchSize
      ) {
        const batchEndIndex = Math.min(pageIndex + batchSize, processEndPage);
        const batchNumber = Math.floor(pageIndex / batchSize) + 1;
        const batchStartPage = pageIndex + 1;
        const batchEndPage = batchEndIndex;

        console.log(
          `\n📦 BATCH ${batchNumber}: Processing Pages ${batchStartPage}-${batchEndPage}`
        );
        console.log(`⏰ Batch processing start: ${new Date().toISOString()}`);

        const batchPages = [];
        let batchContent = "";

        // Prepare each page in the batch with UAHBTDRS starting from 1 for each document
        for (let i = pageIndex; i < batchEndIndex; i++) {
          const pageNumber = i + 1;
          const pageUAHBTDRS = pageNumber; // Keep page-based UAHBTDRS for now
          const pageContent = pages[i];

          console.log(
            `  📄 Processing Page ${pageNumber} with UAHBTDRS: ${pageUAHBTDRS}`
          );
          console.log(
            `      🔍 This ensures same document always gets consistent UAHBTDRS codes`
          );

          console.log(
            `      📏 Content length: ${pageContent.length} characters`
          );
          console.log(
            `      ✅ UAHBTDRS consistency: Page ${pageNumber} → UAHBTDRS ${pageUAHBTDRS}`
          );

          const pageWithUAHBTDRS = this.addUAHBTDRSToPage(
            pageContent,
            pageUAHBTDRS
          );

          // Verify the content includes correct UAHBTDRS
          console.log(
            `      🏷️  Content header: "UAHBTDRS_CODE: ${pageUAHBTDRS}"`
          );

          batchPages.push({
            pageNumber: pageNumber,
            uahbtdrsCode: pageUAHBTDRS,
            content: pageWithUAHBTDRS,
          });

          // Add page to batch content with clear page boundaries and tracking
          batchContent +=
            `\n\n===== PAGE_START_${pageNumber} =====\n   /n  ` +
            pageWithUAHBTDRS +
            `\n===== PAGE_END_${pageNumber} (UAHBTDRS: ${pageUAHBTDRS}) =====\n\n`;
        }

        console.log(
          `📝 Batch content total length: ${batchContent.length} characters`
        );

        console.log("📋 ===== COMPLETE BATCH CONTENT SENT TO LLM =====");
        console.log("🔄 FULL BATCH CONTENT:");
        console.log("=".repeat(100));
        console.log(batchContent);
        console.log("=".repeat(100));
        console.log("📋 ===== END OF BATCH CONTENT =====");

        // Prepare messages for LLM with the batch content
        const messages = [{ role: "system", content: systemPrompt }];

        // Add user message with template
        console.log("🎯 ===== PROMPT TEMPLATE CONSTRUCTION =====");

        if (messageTemplate && messageTemplate.length > 0) {
          console.log("📄 Using predefined message template:");
          console.log(
            "Template structure:",
            JSON.stringify(messageTemplate, null, 2)
          );

          const userMessage = JSON.parse(JSON.stringify(messageTemplate[0]));

          console.log("🔄 Replacing placeholders with document content...");

          // Replace placeholder with actual batch content
          for (let contentItem of userMessage.content) {
            if (contentItem.text === "<ocr_text_placeholder>") {
              console.log(
                "📝 Found <ocr_text_placeholder>, replacing with batch content"
              );
              contentItem.text = batchContent;
            }
          }

          console.log("✅ Final user message after placeholder replacement:");
          console.log(JSON.stringify(userMessage, null, 2));

          messages.push(userMessage);
        } else {
          console.log("📝 No template found, using default message format");
          const defaultMessage = {
            role: "user",
            content: `Process the following document pages and extract relevant information:\n\n${batchContent}  `,
          };

          console.log(
            "📄 Default message:",
            JSON.stringify(defaultMessage, null, 2)
          );
          messages.push(defaultMessage);
        }

        console.log("🎯 ===== END OF PROMPT TEMPLATE CONSTRUCTION =====");

        console.log(
          `🤖 Sending BATCH ${batchNumber} (${batchPages.length} pages) to LLM API...`
        );

        // Call LLM API for this batch
        const llmResponse = await this.callLLM(messages);

        console.log(`✅ LLM response received for BATCH ${batchNumber}`);

        // Parse and store results with UAHBTDRS tracking
        const batchResult = {
          batchNumber: batchNumber,
          startPage: batchStartPage,
          endPage: batchEndPage,
          uahbtdrsRange: {
            start: batchPages[0].uahbtdrsCode,
            end: batchPages[batchPages.length - 1].uahbtdrsCode,
          },
          pagesInBatch: batchPages.map((p) => ({
            pageNumber: p.pageNumber,
            uahbtdrsCode: p.uahbtdrsCode,
          })),
          extractedData: this.parseJSONResponse(llmResponse),
          rawResponse: llmResponse,
        };

        results.push(batchResult);

        console.log(`📊 BATCH ${batchNumber} processing complete`);
        console.log(`   Pages processed: ${batchStartPage}-${batchEndPage}`);
        console.log(
          `   UAHBTDRS range: ${batchResult.uahbtdrsRange.start}-${batchResult.uahbtdrsRange.end}`
        );

        // Ensure batch logs are flushed before continuing
        await new Promise((resolve) => {
          process.stdout.write("", () => {
            setTimeout(resolve, 50);
          });
        });

        // Add delay to avoid rate limiting between batches
        if (batchEndIndex < processEndPage) {
          console.log("⏳ Adding delay before next batch...");
          await this.delay(2000); // Longer delay between batches
        }
      }

      // Calculate the last page number processed
      const lastPageProcessed = processEndPage;
      const lastUAHBTDRSCode = lastPageProcessed;

      console.log("📊 Final UAHBTDRS Summary:");
      console.log(`  Last page processed: ${lastPageProcessed}`);
      console.log(`  Last UAHBTDRS code used: ${lastUAHBTDRSCode}`);
      console.log(
        `  Note: UAHBTDRS codes always match page numbers (Page 1 = UAHBTDRS 1, etc.)`
      );

      return {
        success: true,
        extractionType,
        totalPages: processEndPage - startPage + 1,
        lastUAHBTDRSCode: lastUAHBTDRSCode,
        nextUAHBTDRSCode: lastUAHBTDRSCode + 1,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error processing document:", error);
      throw error;
    }
  }

  // Call OpenAI API
  async callLLM(messages) {
    this.apiCallCounter++;
    console.log("🔥 ===== OPENAI API CALL START =====");
    console.log(`🔢 API Call #${this.apiCallCounter}`);
    console.log("🌐 API URL:", this.apiUrl);
    console.log("🤖 Model:", this.model);
    console.log("🌡️ Temperature:", this.temperature);
    console.log("📝 Max Tokens:", this.maxTokens);
    console.log("📊 Total Messages:", messages.length);

    // Log each message with details
    messages.forEach((message, index) => {
      console.log(`\n📨 MESSAGE ${index + 1}:`);
      console.log(`Role: ${message.role}`);

      if (message.role === "system") {
        console.log("System Prompt:", message.content);
      } else if (message.role === "user") {
        if (Array.isArray(message.content)) {
          console.log("User Message Parts:", message.content.length);
          message.content.forEach((part, partIndex) => {
            console.log(`  Part ${partIndex + 1} (${part.type}):`);
            if (part.text && part.text !== "<ocr_text_placeholder>") {
              console.log(
                `    Text: ${part.text.substring(0, 200)}${
                  part.text.length > 200 ? "..." : ""
                }`
              );
            } else if (part.text === "<ocr_text_placeholder>") {
              console.log(
                `    Text: [DOCUMENT CONTENT - ${part.text.length} characters]`
              );
            }
          });
        } else {
          console.log(
            `Content: ${message.content.substring(0, 200)}${
              message.content.length > 200 ? "..." : ""
            }`
          );
        }
      }
    });

    console.log("\n🚀 Making API call...");

    try {
      const requestPayload = {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: "json_object" },
      };

      console.log("📦 Request Payload Summary:");
      console.log("  - Model:", requestPayload.model);
      console.log("  - Messages Count:", requestPayload.messages.length);
      console.log("  - Temperature:", requestPayload.temperature);
      console.log("  - Max Tokens:", requestPayload.max_tokens);
      console.log("  - Response Format:", requestPayload.response_format);

      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      };

      console.log("📡 Request Headers:");
      console.log(
        "  Authorization:",
        `Bearer ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(
          this.apiKey.length - 4
        )}`
      );
      console.log("  Content-Type:", headers["Content-Type"]);

      const response = await axios.post(this.apiUrl, requestPayload, {
        headers,
      });

      console.log("✅ API Response received!");
      console.log("📊 Response Stats:");
      console.log("  - Status:", response.status);
      console.log("  - Choices:", response.data.choices?.length);
      console.log(
        "  - Finish Reason:",
        response.data.choices?.[0]?.finish_reason
      );
      console.log("  - Token Usage:", response.data.usage);

      const responseContent = response.data.choices[0].message.content;

      console.log("🤖 ===== COMPLETE LLM RESPONSE =====");
      console.log("Full LLM Output:");
      console.log("=".repeat(100));
      console.log(responseContent);
      console.log("=".repeat(100));
      console.log("🤖 ===== END OF LLM RESPONSE =====");

      // Try to parse as JSON to show structured output
      try {
        const parsedResponse = JSON.parse(responseContent);
        console.log("📊 ===== PARSED LLM OUTPUT =====");
        console.log(JSON.stringify(parsedResponse, null, 2));
        console.log("📊 ===== END OF PARSED OUTPUT =====");
      } catch (e) {
        console.log("⚠️  LLM response is not valid JSON");
      }

      console.log("🔥 ===== OPENAI API CALL END =====\n");

      // Ensure all console output is flushed before returning
      await new Promise((resolve) => {
        process.stdout.write("", () => {
          process.stderr.write("", () => {
            setTimeout(resolve, 100); // Small delay to ensure console is fully flushed
          });
        });
      });

      return responseContent;
    } catch (error) {
      console.error("❌ ERROR calling LLM API:");
      console.error("Error message:", error.message);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.log("🔥 ===== OPENAI API CALL END (ERROR) =====\n");

      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  // Paginate content by actual pages (look for page breaks or split evenly)
  paginateContent(content) {
    console.log("📖 Starting content pagination...");

    // Try to split by common page break indicators
    let pages = [];

    // Method 1: Look for page break indicators
    const pageBreakPatterns = [
      /\n\s*Page\s+\d+/gi,
      /\n\s*\d+\s*\n/g,
      /\f/g, // Form feed character
      /\n\s*[-=_]{3,}\s*\n/g, // Horizontal lines
    ];

    let splitContent = content;

    // Try each pattern to find page breaks
    for (const pattern of pageBreakPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 1) {
        console.log(
          `  📝 Found ${matches.length} page breaks using pattern:`,
          pattern.toString()
        );
        pages = content.split(pattern).filter((page) => page.trim().length > 0);
        break;
      }
    }

    // Method 2: If no clear page breaks found, split by content length
    if (pages.length === 0) {
      console.log(
        "  📄 No clear page breaks found, splitting by content length..."
      );
      const avgCharsPerPage = Math.ceil(content.length / 8); // Assuming 8 pages as you mentioned
      console.log(`  📊 Average characters per page: ${avgCharsPerPage}`);

      for (let i = 0; i < content.length; i += avgCharsPerPage) {
        const pageContent = content.substring(i, i + avgCharsPerPage);
        if (pageContent.trim().length > 0) {
          pages.push(pageContent);
        }
      }
    }

    console.log(`  📋 Final pagination result: ${pages.length} pages`);
    pages.forEach((page, index) => {
      console.log(
        `    Page ${index + 1}: ${
          page.length
        } characters, preview: "${page.substring(0, 50)}..."`
      );
    });

    return pages;
  }

  // Add UAHBTDRS code as page number to page content with enhanced tracking
  addUAHBTDRSToPage(pageContent, uahbtdrsCode) {
    return `UAHBTDRS_CODE: ${uahbtdrsCode}   ${"  "} 
PAGE_NUMBER: ${uahbtdrsCode}  
    PAGE_CONTEXT: This information is found on page ${uahbtdrsCode} of the document

${pageContent}`;
  }

  // Parse JSON response from LLM
  parseJSONResponse(response) {
    try {
      // First try to parse as JSON directly
      return JSON.parse(response);
    } catch (error) {
      // If that fails, try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error("Failed to parse JSON from response:", innerError);
          return { raw: response, parseError: true };
        }
      }
      return { raw: response, parseError: true };
    }
  }

  // Clean document content to remove PDF artifacts and OCR errors
  cleanDocumentContent(content) {
    console.log("🧽 Starting aggressive document content cleaning...");

    let cleaned = content;

    // Remove PDF object references and structural elements
    console.log("  🔧 Removing PDF object references...");
    cleaned = cleaned.replace(/\d+\s+0\s+obj/g, "");
    cleaned = cleaned.replace(/\d+\s+\d+\s+obj/g, "");
    cleaned = cleaned.replace(/endobj/g, "");
    cleaned = cleaned.replace(/stream\s*\n[\s\S]*?\nendstream/g, "");
    cleaned = cleaned.replace(/xref[\s\S]*?trailer/g, "");
    cleaned = cleaned.replace(/startxref[\s\S]*?%%EOF/g, "");

    // Remove hexadecimal data patterns
    console.log("  🔢 Removing hexadecimal data...");
    cleaned = cleaned.replace(/[0-9a-fA-F]{8,}/g, ""); // Remove long hex strings
    cleaned = cleaned.replace(/\b[0-9a-fA-F]{6}\s+[nf]\b/g, ""); // Remove hex with n/f suffix
    cleaned = cleaned.replace(/\b00000000[0-9a-fA-F]+/g, ""); // Remove zero-padded hex
    cleaned = cleaned.replace(/\b[0-9a-fA-F]{4,}\s+0{4,}/g, ""); // Remove hex with zeros

    // Remove PDF dictionary and array structures
    console.log("  📚 Removing PDF structures...");
    cleaned = cleaned.replace(/<<[^>]*>>/g, "");
    cleaned = cleaned.replace(/\[[^\]]*\]/g, "");
    cleaned = cleaned.replace(/\/[A-Za-z][A-Za-z0-9]*(\s+\d+(\.\d+)?)?/g, ""); // Remove PDF names

    // Remove common PDF keywords
    console.log("  🔤 Removing PDF keywords...");
    const pdfKeywords = [
      "Font",
      "ProcSet",
      "PDF",
      "Text",
      "ImageB",
      "ImageC",
      "ImageI",
      "Rotate",
      "Trans",
      "Type",
      "Page",
      "MediaBox",
      "Parent",
      "Resources",
      "Contents",
      "Length",
      "Filter",
      "FlateDecode",
      "ASCII85Decode",
      "Width",
      "Height",
      "BitsPerComponent",
      "ColorSpace",
      "DeviceRGB",
    ];

    pdfKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      cleaned = cleaned.replace(regex, "");
    });

    // Remove lines that are mostly numbers or hex
    console.log("  🔢 Removing numeric/hex lines...");
    cleaned = cleaned
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        // Skip empty lines
        if (trimmed.length === 0) return false;

        // Skip lines that are mostly numbers, hex, or single characters
        if (trimmed.length < 3) return false;
        if (/^[0-9a-fA-F\s]+$/.test(trimmed)) return false;
        if (/^[0-9\s]+[nf]?\s*$/.test(trimmed)) return false;

        // Keep lines with actual text content
        const hasLetters = /[a-zA-Z]{2,}/.test(trimmed);
        return hasLetters;
      })
      .join("\n");

    // Remove UAHBTDRS artifacts if they exist
    console.log("  🏷️  Cleaning existing UAHBTDRS artifacts...");
    cleaned = cleaned.replace(/UAHBTDRS_CODE:\s*\d+/g, "");
    cleaned = cleaned.replace(/PAGE NUMBER:\s*\d+/g, "");

    // Clean up whitespace and formatting
    console.log("  📝 Normalizing whitespace...");
    cleaned = cleaned.replace(/\s{3,}/g, " "); // Replace 3+ spaces with single space
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n"); // Replace multiple newlines with double newline
    cleaned = cleaned.replace(/^\s+/gm, ""); // Remove leading spaces from lines
    cleaned = cleaned.replace(/\s+$/gm, ""); // Remove trailing spaces from lines

    // Remove non-printable characters
    console.log("  🧹 Final cleanup...");
    cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, ""); // Remove non-printable characters
    cleaned = cleaned.replace(/={20,}/g, ""); // Remove long lines of equals signs

    // Remove remaining empty lines
    cleaned = cleaned
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");
    cleaned = cleaned.trim();

    console.log("✅ Aggressive document cleaning complete");
    console.log(`  Original length: ${content.length} characters`);
    console.log(`  Cleaned length: ${cleaned.length} characters`);
    console.log(
      `  Reduction: ${(
        ((content.length - cleaned.length) / content.length) *
        100
      ).toFixed(1)}%`
    );

    // If cleaned content is too small, it might be over-cleaned
    if (cleaned.length < 100) {
      console.log(
        "⚠️  WARNING: Cleaned content is very small. Might be over-cleaned."
      );
      console.log("📋 Cleaned content preview:");
      console.log(cleaned);
    }

    return cleaned.length > 0
      ? cleaned
      : "Document content could not be extracted properly due to PDF formatting issues.";
  }

  // Simple PDF text extraction fallback
  extractTextFromPDFBuffer(buffer) {
    try {
      console.log("🔍 Attempting simple PDF text extraction...");
      const bufferString = buffer.toString("utf-8");

      // Look for text between common PDF text markers
      const textMatches = [];

      // Extract text between BT and ET markers (PDF text blocks)
      const btEtPattern = /BT\s*(.*?)\s*ET/gs;
      let match;
      while ((match = btEtPattern.exec(bufferString)) !== null) {
        const textBlock = match[1];
        // Extract text from Tj and TJ operators
        const tjPattern = /\((.*?)\)\s*Tj/g;
        let textMatch;
        while ((textMatch = tjPattern.exec(textBlock)) !== null) {
          textMatches.push(textMatch[1]);
        }
      }

      // Clean and join extracted text
      let extractedText = textMatches
        .map((text) =>
          text.replace(/\\(\d{3})/g, (match, octal) =>
            String.fromCharCode(parseInt(octal, 8))
          )
        )
        .join(" ");

      console.log(
        `📄 Extracted ${extractedText.length} characters using simple method`
      );
      return extractedText;
    } catch (error) {
      console.error("Simple extraction failed:", error);
      return "";
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Process file from Azure Blob Storage
  async processFileFromStorage(fileName, extractionType, options = {}) {
    try {
      console.log("📁 ===== PDF FILE PROCESSING START =====");
      console.log("File name:", fileName);

      // Download file from Azure Blob Storage
      console.log("📥 Downloading file from Azure Blob Storage...");
      const fileBuffer = await azureBlobService.downloadFile(fileName);
      console.log("File downloaded, size:", fileBuffer.length, "bytes");

      // Check if it's a PDF file
      const isPDF = fileName.toLowerCase().endsWith(".pdf");
      console.log("Is PDF file:", isPDF);

      let contentString;

      if (isPDF) {
        console.log("📄 Extracting text from PDF using pdf2json...");
        try {
          // Use your existing PDF processing function
          console.log(
            "📖 Using existing processDocument function from documentService..."
          );
          const pdfResult = await processDocument(fileBuffer, null, fileName);

          // Extract text from the parsed result
          contentString = pdfResult.text;

          console.log("✅ PDF text extraction successful");
          console.log("📊 PDF Info:");
          console.log("  - Total pages:", pdfResult.totalPages);
          console.log("  - Text length:", contentString.length, "characters");
          console.log("  - Pages extracted:", pdfResult.pages.length);

          // Log each page for debugging
          console.log("📄 Page-by-page content:");
          pdfResult.pages.forEach((page, index) => {
            console.log(
              `  Page ${page.page_no}: ${page.content.substring(0, 100)}...`
            );
          });

          console.log("  - Full text preview (first 500 chars):");
          console.log("=".repeat(60));
          console.log(contentString.substring(0, 500));
          console.log("=".repeat(60));

          // If text is still corrupted after pdf2json, try cleaning
          if (
            contentString.includes("endstream") ||
            contentString.includes("0 obj")
          ) {
            console.log(
              "⚠️  PDF text appears corrupted, applying aggressive cleaning..."
            );
            contentString = this.cleanDocumentContent(contentString);
          }
        } catch (pdfError) {
          console.error("❌ PDF parsing failed:", pdfError.message);
          console.log("⚠️  PDF extraction completely failed");

          // Return error message instead of corrupted content
          contentString = `Unable to extract text from PDF file: ${fileName}. Error: ${pdfError.message}`;
        }
      } else {
        console.log("📄 Processing as text file...");
        contentString = fileBuffer.toString("utf-8");
      }

      console.log("📁 ===== PDF FILE PROCESSING END =====");

      // Process the document
      const result = await this.processDocument(
        contentString,
        extractionType,
        options
      );

      // Save result to Azure Blob Storage
      const resultFileName = await azureBlobService.saveProcessingResult(
        fileName,
        result
      );

      return {
        ...result,
        sourceFile: fileName,
        resultFile: resultFileName,
      };
    } catch (error) {
      console.error("Error processing file from storage:", error);
      throw error;
    }
  }

  // Batch process multiple extraction types
  async batchProcess(documentContent, extractionTypes, options = {}) {
    const results = {};
    // UAHBTDRS codes will match page numbers for each document
    let currentUAHBTDRS = options.startUAHBTDRS || 1;

    for (const extractionType of extractionTypes) {
      try {
        const result = await this.processDocument(
          documentContent,
          extractionType,
          { ...options, continueFromUAHBTDRS: currentUAHBTDRS }
        );

        results[extractionType] = result;
        currentUAHBTDRS = result.nextUAHBTDRSCode;

        // Add delay between different extraction types
        await this.delay(2000);
      } catch (error) {
        console.error(`Error processing ${extractionType}:`, error);
        results[extractionType] = {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: true,
      extractionTypes,
      lastUAHBTDRSCode: currentUAHBTDRS - 1,
      results,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new DocumentLLMService();
