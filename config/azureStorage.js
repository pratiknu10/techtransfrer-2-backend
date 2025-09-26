import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'tech-transfer-docs';

if (!accountName || !accountKey) {
  throw new Error('Azure Storage account name and key must be provided');
}

// Build connection string like in Python
const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists
async function ensureContainer() {
  try {
    await containerClient.createIfNotExists({
      access: 'private' // Private access since public access is not permitted
    });
  } catch (error) {
    console.error('Error ensuring container exists:', error);
  }
}

export { containerClient, ensureContainer };