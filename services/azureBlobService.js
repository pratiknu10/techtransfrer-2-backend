import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AzureBlobService {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';

    if (!this.connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);

    // Initialize UAHBTDRS tracking file
    this.uahbtdrsFile = path.join(__dirname, '..', 'data', 'uahbtdrs_tracking.json');
    this.initializeTracking();
  }

  async initializeTracking() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      await fs.mkdir(dataDir, { recursive: true });

      try {
        await fs.access(this.uahbtdrsFile);
      } catch {
        // File doesn't exist, create it with initial value
        await fs.writeFile(this.uahbtdrsFile, JSON.stringify({ currentCode: 1 }, null, 2));
      }
    } catch (error) {
      console.error('Error initializing UAHBTDRS tracking:', error);
    }
  }

  async getNextUAHBTDRSCode() {
    try {
      const data = await fs.readFile(this.uahbtdrsFile, 'utf8');
      const tracking = JSON.parse(data);
      const currentCode = tracking.currentCode || 1;

      // Update to next code
      tracking.currentCode = currentCode + 1;
      await fs.writeFile(this.uahbtdrsFile, JSON.stringify(tracking, null, 2));

      return currentCode;
    } catch (error) {
      console.error('Error getting UAHBTDRS code:', error);
      return 1; // Fallback to 1
    }
  }

  async updateUAHBTDRSCode(newCode) {
    try {
      await fs.writeFile(this.uahbtdrsFile, JSON.stringify({ currentCode: newCode }, null, 2));
    } catch (error) {
      console.error('Error updating UAHBTDRS code:', error);
    }
  }

  async ensureContainerExists() {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      console.error('Error creating container:', error);
      throw error;
    }
  }

  async uploadFile(fileName, fileBuffer, metadata = {}) {
    try {
      await this.ensureContainerExists();

      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

      const uploadOptions = {
        metadata: metadata,
        blobHTTPHeaders: {
          blobContentType: metadata.contentType || 'application/octet-stream'
        }
      };

      await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);

      return {
        fileName,
        url: blockBlobClient.url,
        size: fileBuffer.length,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading file to Azure Blob Storage:', error);
      throw error;
    }
  }

  async downloadFile(fileName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

      const downloadResponse = await blockBlobClient.download();
      const downloadedContent = await this.streamToBuffer(downloadResponse.readableStreamBody);

      return downloadedContent;
    } catch (error) {
      console.error('Error downloading file from Azure Blob Storage:', error);
      throw error;
    }
  }

  async deleteFile(fileName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.delete();

      return {
        deleted: true,
        fileName
      };
    } catch (error) {
      console.error('Error deleting file from Azure Blob Storage:', error);
      throw error;
    }
  }

  async listFiles(prefix = '') {
    try {
      const files = [];

      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          contentType: blob.properties.contentType
        });
      }

      return files;
    } catch (error) {
      console.error('Error listing files from Azure Blob Storage:', error);
      throw error;
    }
  }

  async streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  async getFileUrl(fileName) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    return blockBlobClient.url;
  }

  async fileExists(fileName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      return await blockBlobClient.exists();
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  async saveProcessingResult(fileName, result) {
    try {
      const resultFileName = `results/${fileName}_result_${Date.now()}.json`;
      const resultBuffer = Buffer.from(JSON.stringify(result, null, 2));

      await this.uploadFile(resultFileName, resultBuffer, {
        contentType: 'application/json',
        originalFile: fileName
      });

      return resultFileName;
    } catch (error) {
      console.error('Error saving processing result:', error);
      throw error;
    }
  }
}

export default new AzureBlobService();