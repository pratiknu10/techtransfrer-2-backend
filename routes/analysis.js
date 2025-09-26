import express from 'express';
import { gapAnalysis } from '../controllers/analysisController.js';

const router = express.Router();

router.post('/gap-analysis', gapAnalysis);

export default router;