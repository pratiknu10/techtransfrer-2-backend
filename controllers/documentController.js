import { containerClient } from '../config/azureStorage.js';

export const viewDocument = async (req, res) => {
  try {
    // Get the blob name from params
    const blobName = req.params[0] || req.params.blobName;

    console.log('Viewing document with blob name:', blobName);

    if (!blobName) {
      return res.status(400).json({ error: 'Blob name is required' });
    }

    try {
      // Get blob client
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      console.log('Azure Blob URL:', blockBlobClient.url);

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

      // Download the blob
      const downloadResponse = await blockBlobClient.download();

      console.log('Blob download initiated');

      // Set proper headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Pipe the blob stream to response
      downloadResponse.readableStreamBody.pipe(res);

    } catch (azureError) {
      console.error('Azure Blob Storage error:', azureError);
      return res.status(500).json({
        error: 'Failed to fetch from Azure Blob Storage',
        details: azureError.message,
        blobName: blobName
      });
    }

  } catch (error) {
    console.error('Document viewing error:', error);
    res.status(500).json({ error: 'Failed to load document', details: error.message });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { blobName } = req.params;

    if (!blobName) {
      return res.status(400).json({ error: 'Blob name is required' });
    }

    try {
      // Get blob client
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        return res.status(404).json({
          error: 'Document not found',
          details: 'The requested document does not exist',
          blobName: blobName
        });
      }

      // Get blob properties to extract filename
      const properties = await blockBlobClient.getProperties();
      const filename = blobName.split('-').slice(1).join('-'); // Remove timestamp prefix

      // Set headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Download and pipe the blob
      const downloadResponse = await blockBlobClient.download();
      downloadResponse.readableStreamBody.pipe(res);

    } catch (azureError) {
      console.error('Azure Blob Storage download error:', azureError);
      return res.status(500).json({
        error: 'Failed to download from Azure Blob Storage',
        details: azureError.message,
        blobName: blobName
      });
    }

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ error: 'Failed to download document', details: error.message });
  }
};