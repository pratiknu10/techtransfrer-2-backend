import documentLLMService from "../services/documentLLMService.js";
import azureBlobService from "../services/azureBlobService.js";
import multer from "multer";
import fs from "fs/promises";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

class DocumentProcessorController {
  // Upload document and process with all categories
  async uploadAndProcess(req, res) {
    try {
      const { templateId, context, startPage, endPage } = req.body;
      console.log("Starting upload and process...");

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(
        `File received: ${req.file.originalname}, size: ${req.file.size}`
      );

      // Upload file to Azure Blob Storage
      const fileName = `uploads/${Date.now()}_${req.file.originalname}`;
      console.log("Uploading to Azure Blob Storage...");

      const uploadResult = await azureBlobService.uploadFile(
        fileName,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          originalName: req.file.originalname,
        }
      );

      console.log("Upload successful:", uploadResult.fileName);

      // Send immediate response about upload success
      res.json({
        success: true,
        message: "Document uploaded successfully - processing started",
        uploadInfo: uploadResult,
        status: "processing_started",
      });

      // Process document for all categories in background
      const processOptions = {
        templateId: parseInt(templateId) || 1,
        context: context || "",
        startPage: parseInt(startPage) || 1,
        endPage: endPage ? parseInt(endPage) : null,
      };

      console.log("Starting document processing in background...");

      // Process asynchronously to avoid timeout
      setImmediate(async () => {
        const allCategories = ["CAT_01"];
        const results = {};

        for (const category of allCategories) {
          try {
            console.log(`Processing category: ${category}`);
            const result = await documentLLMService.processFileFromStorage(
              fileName,
              category,
              processOptions
            );
            results[category] = result;
            console.log(`Completed processing: ${category}`);
          } catch (error) {
            console.error(`Error processing ${category}:`, error);
            results[category] = { error: error.message };
          }
        }

        // Save final results to storage
        try {
          await azureBlobService.saveProcessingResult(fileName, results);
          console.log("Processing results saved to storage");
        } catch (error) {
          console.error("Error saving results:", error);
        }
      });
    } catch (error) {
      console.error("Error in uploadAndProcess:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to upload and process document",
          details: error.message,
        });
      }
    }
  }

  // Process existing file from Azure Blob Storage (synchronous version)
  async processExistingFileSync(req, res) {
    try {
      const { fileName } = req.body;

      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }

      console.log(`Processing existing file (SYNC): ${fileName}`);

      // Check if file exists
      const fileExists = await azureBlobService.fileExists(fileName);
      if (!fileExists) {
        return res.status(404).json({ error: "File not found in storage" });
      }

      console.log(`File exists, starting synchronous processing...`);

      // Use default process options
      const processOptions = {
        templateId: 1,
        context: "",
        startPage: 1,
        endPage: null,
        continueFromUAHBTDRS: null,
      };

      // Process CAT_01 category synchronously
      console.log(`Processing ${fileName} for category: CAT_01`);

      const result = await documentLLMService.processFileFromStorage(
        fileName,
        "CAT_01",
        processOptions
      );

      console.log(`Completed processing ${fileName} for: CAT_01`);
      console.log(
        `✅ All processing logs complete - preparing API response...`
      );

      // Ensure all console output is fully flushed before sending response
      await new Promise((resolve) => {
        process.stdout.write("", () => {
          process.stderr.write("", () => {
            setTimeout(() => {
              console.log(`🚀 Sending final API response now...`);
              resolve();
            }, 200); // Longer delay to ensure complete console flushing
          });
        });
      });

      // Return the complete result directly
      res.json({
        success: true,
        message: "Document processed successfully",
        fileName: fileName,
        processingResult: result,
      });
    } catch (error) {
      console.error("Error in processExistingFileSync:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process document",
        details: error.message,
      });
    }
  }

  // Process existing file from Azure Blob Storage (async version)
  async processExistingFile(req, res) {
    console.log("=== PROCESS FILE ENDPOINT HIT ===");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);

    try {
      const { fileName } = req.body;

      if (!fileName) {
        console.log("❌ ERROR: fileName is required");
        return res.status(400).json({ error: "fileName is required" });
      }

      console.log(`✅ Step 1: Processing existing file: ${fileName}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      // Send immediate acknowledgment
      console.log("📤 Step 2: Sending immediate response...");
      res.status(202).json({
        success: true,
        message: "Processing request received, starting document processing...",
        fileName: fileName,
        status: "processing",
      });

      console.log("✅ Step 3: Immediate response sent successfully");
      console.log("🚀 Step 4: Starting background processing...");

      // Process in background to avoid connection issues
      setImmediate(async () => {
        try {
          console.log("🔍 Step 5: Checking if file exists in Azure storage...");
          console.log(`File path to check: ${fileName}`);

          // Check if file exists
          const fileExists = await azureBlobService.fileExists(fileName);
          console.log(`File exists result: ${fileExists}`);

          if (!fileExists) {
            console.log("❌ ERROR: File not found in storage");
            return;
          }

          console.log(
            `✅ Step 6: File confirmed to exist, starting processing...`
          );

          // Use default process options
          const processOptions = {
            templateId: 1,
            context: "",
            startPage: 1,
            endPage: null,
            continueFromUAHBTDRS: null,
          };

          console.log("📋 Process options:", processOptions);

          // Process CAT_01 category
          console.log(
            `🔄 Step 7: Starting LLM processing for ${fileName} with category: CAT_01`
          );
          console.log(`⏰ Processing start time: ${new Date().toISOString()}`);

          const result = await documentLLMService.processFileFromStorage(
            fileName,
            "CAT_01",
            processOptions
          );

          console.log(`✅ Step 8: LLM processing completed for ${fileName}`);
          console.log(`⏰ Processing end time: ${new Date().toISOString()}`);
          console.log("📊 Result preview:", {
            success: result?.success,
            extractionType: result?.extractionType,
            totalResults: result?.results?.length,
          });

          // Log the full result
          console.log("📋 ===== COMPLETE PROCESSING RESULT =====");
          console.log(JSON.stringify(result, null, 2));
          console.log("📋 ===== END OF PROCESSING RESULT =====");

          // Save result with timestamp for retrieval
          const resultFileName = `processed_${Date.now()}_${
            fileName.split("/")[1]
          }.json`;
          console.log(`💾 Step 9: Saving results to: ${resultFileName}`);

          await azureBlobService.saveProcessingResult(resultFileName, {
            fileName: fileName,
            processedAt: new Date().toISOString(),
            result: result,
          });

          console.log(
            `✅ Step 10: Results successfully saved to: ${resultFileName}`
          );
          console.log("🎉 PROCESSING COMPLETE! 🎉");

          console.log("\n🔍 ===== HOW TO RETRIEVE RESULTS =====");
          console.log(`To get your results, call:`);
          console.log(
            `GET /api/v1/document-processor/results/${resultFileName}`
          );
          console.log("🔍 ===== END OF INSTRUCTIONS =====");
        } catch (error) {
          console.error("❌ ERROR in background processing:");
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
          console.error("Error details:", error);
        }
      });
    } catch (error) {
      console.error("❌ ERROR in processExistingFile main try block:");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to start processing",
          details: error.message,
        });
      }
    }
  }

  // Process with multiple extraction types
  async batchProcessFile(req, res) {
    try {
      const {
        fileName,
        extractionTypes,
        templateId,
        context,
        startPage,
        endPage,
      } = req.body;

      if (!fileName || !extractionTypes || !Array.isArray(extractionTypes)) {
        return res
          .status(400)
          .json({ error: "fileName and extractionTypes array are required" });
      }

      // Check if file exists
      const fileExists = await azureBlobService.fileExists(fileName);
      if (!fileExists) {
        return res.status(404).json({ error: "File not found in storage" });
      }

      // Download and process file
      const fileContent = await azureBlobService.downloadFile(fileName);
      const contentString = fileContent.toString("utf-8");

      const processOptions = {
        templateId: parseInt(templateId) || 1,
        context: context || "",
        startPage: parseInt(startPage) || 1,
        endPage: endPage ? parseInt(endPage) : null,
      };

      const result = await documentLLMService.batchProcess(
        contentString,
        extractionTypes,
        processOptions
      );

      // Save batch result to storage
      const resultFileName = await azureBlobService.saveProcessingResult(
        `batch_${fileName}`,
        result
      );

      res.json({
        success: true,
        message: "Batch processing completed successfully",
        processingResult: result,
        resultFile: resultFileName,
      });
    } catch (error) {
      console.error("Error in batchProcessFile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to batch process document",
        details: error.message,
      });
    }
  }

  // Get UAHBTDRS status
  async getUAHBTDRSStatus(req, res) {
    try {
      const currentCode = await azureBlobService.getNextUAHBTDRSCode();
      // Since getNextUAHBTDRSCode increments the code, we need to subtract 1 to get current
      const actualCurrentCode = currentCode - 1;
      await azureBlobService.updateUAHBTDRSCode(actualCurrentCode);

      res.json({
        success: true,
        currentUAHBTDRSCode: actualCurrentCode,
        nextUAHBTDRSCode: actualCurrentCode + 1,
      });
    } catch (error) {
      console.error("Error getting UAHBTDRS status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get UAHBTDRS status",
        details: error.message,
      });
    }
  }

  // Reset or set UAHBTDRS code
  async setUAHBTDRSCode(req, res) {
    try {
      const { code } = req.body;

      if (!code || isNaN(parseInt(code))) {
        return res.status(400).json({ error: "Valid code number is required" });
      }

      await azureBlobService.updateUAHBTDRSCode(parseInt(code));

      res.json({
        success: true,
        message: "UAHBTDRS code updated successfully",
        newCode: parseInt(code),
      });
    } catch (error) {
      console.error("Error setting UAHBTDRS code:", error);
      res.status(500).json({
        success: false,
        error: "Failed to set UAHBTDRS code",
        details: error.message,
      });
    }
  }

  // List files in Azure Blob Storage
  async listFiles(req, res) {
    try {
      const { prefix } = req.query;
      const files = await azureBlobService.listFiles(prefix || "");

      res.json({
        success: true,
        files,
        count: files.length,
      });
    } catch (error) {
      console.error("Error listing files:", error);
      res.status(500).json({
        success: false,
        error: "Failed to list files",
        details: error.message,
      });
    }
  }

  // Delete file from Azure Blob Storage
  async deleteFile(req, res) {
    try {
      const { fileName } = req.params;

      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }

      const result = await azureBlobService.deleteFile(fileName);

      res.json({
        success: true,
        message: "File deleted successfully",
        result,
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete file",
        details: error.message,
      });
    }
  }

  // Download processed results
  async downloadResult(req, res) {
    try {
      const { resultFileName } = req.params;

      if (!resultFileName) {
        return res.status(400).json({ error: "resultFileName is required" });
      }

      const fileContent = await azureBlobService.downloadFile(resultFileName);
      const result = JSON.parse(fileContent.toString("utf-8"));

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Error downloading result:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download result",
        details: error.message,
      });
    }
  }

  // Get available extraction types
  async getExtractionTypes(req, res) {
    try {
      const extractionTypes = [
        {
          code: "CAT_01",
          name: "Process Definition",
          description: "End-to-end process description & flows; CPP/CQA intent",
          fields: [
            "Product_Name",
            "Strength",
            "Dosage_Form",
            "CQA",
            "CPP",
            "UAHBTDRS_CODE",
          ],
        },
        {
          code: "CAT_02",
          name: "Manufacturing Recipe & Automation",
          description:
            "ISA-88 breakdown, phases, parameters, interlocks, alarms, state model, scaling; CPP/CQA intent",
          fields: [
            "Unit_Procedure",
            "Phase_Name",
            "Setpoint",
            "PAR_Min",
            "Operating_Range_Min",
            "Operating_Range_Max",
            "UAHBTDRS_CODE",
          ],
        },
      ];

      res.json({
        success: true,
        extractionTypes,
        count: extractionTypes.length,
        message:
          "All categories are automatically processed - no need to specify extractionType",
      });
    } catch (error) {
      console.error("Error getting extraction types:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get extraction types",
        details: error.message,
      });
    }
  }

  // Health check endpoint
  async healthCheck(req, res) {
    try {
      // Test Azure Blob Storage connection
      await azureBlobService.ensureContainerExists();

      res.json({
        success: true,
        message: "Document processor service is healthy",
        timestamp: new Date().toISOString(),
        services: {
          azureStorage: "connected",
          llmService: "ready",
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        success: false,
        error: "Health check failed",
        details: error.message,
      });
    }
  }
}

// Export controller instance and upload middleware
const controller = new DocumentProcessorController();

export { controller, upload };
