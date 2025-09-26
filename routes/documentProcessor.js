import express from 'express';
import { controller, upload } from '../controllers/documentProcessorController.js';

const router = express.Router();

// Health check endpoint
router.get('/health', controller.healthCheck);

// Upload and process document
router.post('/upload-and-process', upload.single('document'), controller.uploadAndProcess);

// Process existing file from storage (async - returns immediately)
router.post('/process-file', controller.processExistingFile);

// Process existing file from storage (sync - waits for result)
router.post('/process-file-sync', controller.processExistingFileSync);

// Batch process file with multiple extraction types
router.post('/batch-process', controller.batchProcessFile);

// UAHBTDRS management endpoints
router.get('/uahbtdrs/status', controller.getUAHBTDRSStatus);
router.post('/uahbtdrs/set', controller.setUAHBTDRSCode);

// File management endpoints
router.get('/files', controller.listFiles);
router.delete('/files/:fileName', controller.deleteFile);

// Results endpoints
router.get('/results/:resultFileName', controller.downloadResult);

// Get available extraction types
router.get('/extraction-types', controller.getExtractionTypes);

export default router;