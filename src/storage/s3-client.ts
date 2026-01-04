/**
 * @file s3-client.ts
 * @description S3 client wrapper for file storage operations
 * Handles exports, artifacts, backups, and logs
 */

import {
  S3Client as AWSS3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand
} from '@aws-sdk/client-s3';

export interface S3Config {
  bucketName: string;
  region: string;
  endpoint?: string; // For local testing (e.g., LocalStack)
}

export class S3Client {
  private client: AWSS3Client;
  private bucketName: string;

  constructor(config: S3Config) {
    this.bucketName = config.bucketName;
    
    this.client = new AWSS3Client({
      region: config.region,
      ...(config.endpoint && { endpoint: config.endpoint, forcePathStyle: true })
    });
  }

  async initialize(): Promise<void> {
    try {
      // Verify bucket exists
      const command = new HeadBucketCommand({ Bucket: this.bucketName });
      await this.client.send(command);
      console.log(`✅ S3 bucket verified: ${this.bucketName}`);
    } catch (error: any) {
      console.error(`❌ Failed to verify S3 bucket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    data: Buffer | string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      Metadata: metadata,
      ContentType: this.getContentType(key)
    });

    try {
      await this.client.send(command);
      return `s3://${this.bucketName}/${key}`;
    } catch (error: any) {
      console.error(`Error uploading file ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Download a file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    try {
      const result = await this.client.send(command);
      
      if (!result.Body) {
        throw new Error(`No data returned for key: ${key}`);
      }
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of result.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error(`Error downloading file ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      console.error(`Error deleting file ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * List files with a specific prefix
   */
  async listFiles(prefix: string, maxKeys: number = 1000): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys
    });

    try {
      const result = await this.client.send(command);
      return result.Contents?.map(obj => obj.Key || '') || [];
    } catch (error: any) {
      console.error(`Error listing files with prefix ${prefix}:`, error.message);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<Record<string, string> | undefined> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    try {
      const result = await this.client.send(command);
      return result.Metadata;
    } catch (error: any) {
      console.error(`Error getting file metadata ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate pre-signed URL for file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Note: This requires @aws-sdk/s3-request-presigner
    // For now, return S3 URI
    return `s3://${this.bucketName}/${key}`;
  }

  /**
   * Determine content type from file extension
   */
  private getContentType(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase();
    
    const contentTypes: Record<string, string> = {
      'json': 'application/json',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip'
    };
    
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Upload with automatic prefix (exports/, backups/, logs/, artifacts/)
   */
  async uploadExport(filename: string, data: any): Promise<string> {
    const key = `exports/${filename}`;
    return this.uploadFile(key, JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      exportedAt: new Date().toISOString()
    });
  }

  async uploadBackup(filename: string, data: any): Promise<string> {
    const key = `backups/${filename}`;
    return this.uploadFile(key, JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      backupType: 'full'
    });
  }

  async uploadLog(filename: string, data: string): Promise<string> {
    const key = `logs/${filename}`;
    return this.uploadFile(key, data, {
      contentType: 'text/plain',
      loggedAt: new Date().toISOString()
    });
  }

  async uploadArtifact(filename: string, data: Buffer | string): Promise<string> {
    const key = `artifacts/${filename}`;
    return this.uploadFile(key, data, {
      uploadedAt: new Date().toISOString()
    });
  }
}
