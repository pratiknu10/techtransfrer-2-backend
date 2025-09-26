import { containerClient, ensureContainer } from '../config/azureStorage.js';
import { processDocument } from '../services/documentService.js';

export const uploadDocument = async (req, res) => {
  console.log('\n=== UPLOAD DOCUMENT STARTED ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('File details:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    buffer: req.file.buffer ? 'Present' : 'Missing'
  } : 'No file');

  try {
    if (!req.file) {
      console.log('ERROR: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if file is a PDF
    if (req.file.mimetype !== 'application/pdf') {
      console.log('ERROR: Invalid file type:', req.file.mimetype);
      return res.status(400).json({
        error: 'Invalid file type',
        details: 'Only PDF files are supported',
        received: req.file.mimetype
      });
    }

    console.log('Starting Azure Blob Storage upload...');

    // Ensure container exists
    await ensureContainer();

    // Create unique blob name
    const blobName = `${Date.now()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload to Azure Blob Storage
    const uploadResponse = await blockBlobClient.upload(
      req.file.buffer,
      req.file.buffer.length,
      {
        blobHTTPHeaders: {
          blobContentType: req.file.mimetype
        }
      }
    );

    console.log('Azure Blob Storage upload successful:', {
      blobName: blobName,
      url: blockBlobClient.url
    });

    try {
      console.log('Starting document processing...');
      console.log('Calling processDocument with buffer size:', req.file.buffer.length);

      const processedDoc = await processDocument(req.file.buffer, blockBlobClient.url, req.file.originalname);
      console.log('Document processed successfully:', {
        totalPages: processedDoc.totalPages,
        pagesCount: processedDoc.pages.length
      });

      res.json({
        message: 'Document uploaded and processed successfully',
        document: {
          id: blobName,
          url: blockBlobClient.url,
          filename: req.file.originalname,
          pages: processedDoc.pages,
          totalPages: processedDoc.totalPages
        }
      });
    } catch (processError) {
      console.error('\n=== DOCUMENT PROCESSING ERROR ===');
      console.error('Error name:', processError.name);
      console.error('Error message:', processError.message);
      console.error('Error stack:', processError.stack);
      console.error('===================================\n');

      res.status(500).json({
        error: 'Document processing failed',
        details: processError.message,
        hint: 'Please ensure the file is a valid PDF document'
      });
    }

  } catch (error) {
    console.error('\n=== GENERAL UPLOAD ERROR ===');
    console.error('Error:', error);
    console.error('==============================\n');
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};