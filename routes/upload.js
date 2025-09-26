import express from "express";
import upload from "../middleware/upload.js";
import { uploadDocument } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", upload.single("document"), uploadDocument);

export default router;
