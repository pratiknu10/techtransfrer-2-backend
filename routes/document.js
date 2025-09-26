import express from 'express';
import { viewDocument, downloadDocument } from '../controllers/documentController.js';
import { proxyDocument } from '../controllers/proxyController.js';

const router = express.Router();

// Simple proxy endpoint using query parameter
router.get('/proxy', proxyDocument);

// View PDF in browser - handle nested paths
router.get('/view/*', viewDocument);

// Download PDF - handle nested paths
router.get('/download/*', downloadDocument);

export default router;