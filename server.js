import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import analysisRoutes from "./routes/analysis.js";
import csvRoutes from "./routes/csv.js";
import documentRoutes from "./routes/document.js";
import documentProcessorRoutes from "./routes/documentProcessor.js";

dotenv.config();

// Log environment variables for debugging
console.log("🔧 ===== SERVER ENVIRONMENT VARIABLES =====");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0);
console.log("OPENAI_API_KEY preview:", process.env.OPENAI_API_KEY ?
  `${process.env.OPENAI_API_KEY.substring(0, 10)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : 'NOT FOUND');
console.log("🔧 ===== END ENVIRONMENT VARIABLES =====");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Set request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(900000, () => {
    console.log('Request timeout');
  });
  res.setTimeout(900000, () => {
    console.log('Response timeout');
  });
  next();
});

app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/analysis", analysisRoutes);
app.use("/api/v1/csv", csvRoutes);
app.use("/api/v1/document", documentRoutes);
app.use("/api/v1/document-processor", documentProcessorRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Tech Transfer API is running" });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Increase server timeout for document processing
server.timeout = 900000; // 15 minutes
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
