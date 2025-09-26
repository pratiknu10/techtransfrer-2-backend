# Tech Transfer Backend - Gap Analysis API

## Overview
Node.js Express application for tech transfer gap analysis with document processing and AI-powered search capabilities.

## Features
- PDF document upload and processing
- Cloudinary integration for file storage
- OpenAI-powered semantic search
- Exact text matching
- Gap analysis with tag-based search

## Installation

```bash
npm install
```

## Environment Setup
Configure your `.env` file with:
- `OPENAI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PORT`

## Usage

### Start Server
```bash
npm start
# or for development
npm run dev
```

Server will run on port 3200 (as configured in .env)

### API Endpoints

#### Upload Document
```
POST /api/v1/upload
Content-Type: multipart/form-data
Body: document (PDF file)
```

#### Gap Analysis
```
POST /api/v1/analysis/gap-analysis
Content-Type: application/json
Body: {
  "documents": ["s3://bucket/fileA.pdf", "s3://bucket/fileB.pdf"],
  "items": [
    {"tag": "Stability data", "description": "Accelerated stability at 40°C/75%RH"},
    {"tag": "Batch record", "description": "Granulation parameters"}
  ],
  "top_k": 3
}
```

Response:
```json
{
  "results": [
    {
      "doc_id": "fileA.pdf",
      "page_no": 7,
      "page_label": "7",
      "tag": "Stability data",
      "description": "Accelerated stability at 40°C/75%RH",
      "method": "semantic",
      "score": 0.61
    }
  ]
}
```

## Search Methods
- **Exact**: Direct text matching
- **Semantic**: AI-powered relevance scoring using OpenAI GPT-3.5-turbo