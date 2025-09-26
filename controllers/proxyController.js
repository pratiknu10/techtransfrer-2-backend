import { containerClient } from '../config/azureStorage.js';

export const proxyDocument = async (req, res) => {
  try {
    let { blobName, url } = req.query;

    // If URL is provided, extract blob name from it
    if (url && !blobName) {
      console.log('Extracting blob name from URL:', url);

      // Extract blob name from Azure Blob Storage URL
      if (url.includes('blob.core.windows.net')) {
        const urlParts = url.split('/');
        blobName = urlParts[urlParts.length - 1];
        console.log('Extracted blob name:', blobName);
      }
    }

    if (!blobName) {
      return res.status(400).json({
        error: 'Blob name or URL parameter is required',
        example: '?blobName=filename.pdf or ?url=https://storageaccount.blob.core.windows.net/container/filename.pdf'
      });
    }

    console.log('Proxying document with blob name:', blobName);

    try {
      // Get blob client
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        console.error('Blob not found:', blobName);
        return res.status(404).json({
          error: 'Document not found',
          details: 'The requested document does not exist',
          blobName: blobName
        });
      }

      console.log('Successfully found blob:', blobName);

      // Set headers and serve the PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Download and pipe the blob
      const downloadResponse = await blockBlobClient.download();
      downloadResponse.readableStreamBody.pipe(res);

    } catch (azureError) {
      console.error('Azure Blob Storage error:', azureError);
      res.status(404).json({
        error: 'Document not found',
        details: azureError.message,
        blobName: blobName
      });
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy document', details: error.message });
  }
};