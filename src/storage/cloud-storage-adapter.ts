/**
 * @file cloud-storage-adapter.ts
 * @description Cloud storage adapter using DynamoDB and S3
 * Replaces local JSON file storage with AWS cloud services
 */

import { DynamoDBClient } from './dynamodb-client';
import { S3Client } from './s3-client';

export interface StorageAdapter {
  initialize(): Promise<void>;
  
  // User operations
  getUser(username: string): Promise<any>;
  getAllUsers(): Promise<any[]>;
  saveUser(username: string, userData: any): Promise<void>;
  deleteUser(username: string): Promise<void>;
  
  // Test operations
  getTest(id: string): Promise<any>;
  getAllTests(): Promise<any[]>;
  saveTest(id: string, testData: any): Promise<void>;
  deleteTest(id: string): Promise<void>;
  
  // Issue operations
  getIssue(id: string): Promise<any>;
  getAllIssues(): Promise<any[]>;
  saveIssue(id: string, issueData: any): Promise<void>;
  deleteIssue(id: string): Promise<void>;
  
  // Defect operations
  getDefect(id: string): Promise<any>;
  getAllDefects(): Promise<any[]>;
  saveDefect(id: string, defectData: any): Promise<void>;
  deleteDefect(id: string): Promise<void>;
  
  // File operations (for exports, backups)
  uploadFile(key: string, data: Buffer | string, metadata?: any): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  listFiles(prefix: string): Promise<string[]>;
}

export class CloudStorageAdapter implements StorageAdapter {
  private dynamodb: DynamoDBClient;
  private s3: S3Client;
  private initialized: boolean = false;

  constructor() {
    this.dynamodb = new DynamoDBClient({
      tableName: process.env.DYNAMODB_TABLE || 'testmgr-data',
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.s3 = new S3Client({
      bucketName: process.env.S3_BUCKET || 'testmgr-storage',
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Initializing cloud storage adapter...');
    await this.dynamodb.initialize();
    await this.s3.initialize();
    
    this.initialized = true;
    console.log('✅ Cloud storage initialized');
  }

  // ===========================
  // User Operations
  // ===========================

  async getUser(username: string): Promise<any> {
    return this.dynamodb.getItem('USER', username);
  }

  async getAllUsers(): Promise<any[]> {
    return this.dynamodb.queryByType('USER');
  }

  async saveUser(username: string, userData: any): Promise<void> {
    await this.dynamodb.putItem('USER', username, {
      ...userData,
      username,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteUser(username: string): Promise<void> {
    await this.dynamodb.deleteItem('USER', username);
  }

  // ===========================
  // Test Operations
  // ===========================

  async getTest(id: string): Promise<any> {
    return this.dynamodb.getItem('TEST', id);
  }

  async getAllTests(): Promise<any[]> {
    return this.dynamodb.queryByType('TEST');
  }

  async saveTest(id: string, testData: any): Promise<void> {
    await this.dynamodb.putItem('TEST', id, {
      ...testData,
      id,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteTest(id: string): Promise<void> {
    await this.dynamodb.deleteItem('TEST', id);
  }

  // ===========================
  // Issue Operations
  // ===========================

  async getIssue(id: string): Promise<any> {
    return this.dynamodb.getItem('ISSUE', id);
  }

  async getAllIssues(): Promise<any[]> {
    return this.dynamodb.queryByType('ISSUE');
  }

  async saveIssue(id: string, issueData: any): Promise<void> {
    await this.dynamodb.putItem('ISSUE', id, {
      ...issueData,
      id,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteIssue(id: string): Promise<void> {
    await this.dynamodb.deleteItem('ISSUE', id);
  }

  // ===========================
  // Defect Operations
  // ===========================

  async getDefect(id: string): Promise<any> {
    return this.dynamodb.getItem('DEFECT', id);
  }

  async getAllDefects(): Promise<any[]> {
    return this.dynamodb.queryByType('DEFECT');
  }

  async saveDefect(id: string, defectData: any): Promise<void> {
    await this.dynamodb.putItem('DEFECT', id, {
      ...defectData,
      id,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteDefect(id: string): Promise<void> {
    await this.dynamodb.deleteItem('DEFECT', id);
  }

  // ===========================
  // File Operations (S3)
  // ===========================

  async uploadFile(key: string, data: Buffer | string, metadata?: any): Promise<string> {
    return this.s3.uploadFile(key, data, metadata);
  }

  async downloadFile(key: string): Promise<Buffer> {
    return this.s3.downloadFile(key);
  }

  async deleteFile(key: string): Promise<void> {
    return this.s3.deleteFile(key);
  }

  async listFiles(prefix: string): Promise<string[]> {
    return this.s3.listFiles(prefix);
  }

  // ===========================
  // Bulk Operations
  // ===========================

  async exportToS3(filename: string, data: any): Promise<string> {
    const key = `exports/${filename}`;
    const jsonData = JSON.stringify(data, null, 2);
    return this.uploadFile(key, jsonData, {
      contentType: 'application/json',
      exportedAt: new Date().toISOString()
    });
  }

  async importFromS3(key: string): Promise<any> {
    const data = await this.downloadFile(key);
    return JSON.parse(data.toString('utf-8'));
  }

  // ===========================
  // Backup Operations
  // ===========================

  async createBackup(): Promise<string> {
    console.log('Creating backup to S3...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      users: await this.getAllUsers(),
      tests: await this.getAllTests(),
      issues: await this.getAllIssues(),
      defects: await this.getAllDefects()
    };
    
    const key = `backups/backup-${timestamp}.json`;
    await this.uploadFile(key, JSON.stringify(backupData, null, 2), {
      contentType: 'application/json',
      backupType: 'full'
    });
    
    console.log(`✅ Backup created: ${key}`);
    return key;
  }

  async restoreFromBackup(backupKey: string): Promise<void> {
    console.log(`Restoring from backup: ${backupKey}`);
    
    const backupData = await this.importFromS3(backupKey);
    
    // Restore users
    for (const user of backupData.users || []) {
      await this.saveUser(user.username, user);
    }
    
    // Restore tests
    for (const test of backupData.tests || []) {
      await this.saveTest(test.id, test);
    }
    
    // Restore issues
    for (const issue of backupData.issues || []) {
      await this.saveIssue(issue.id, issue);
    }
    
    // Restore defects
    for (const defect of backupData.defects || []) {
      await this.saveDefect(defect.id, defect);
    }
    
    console.log('✅ Backup restored successfully');
  }

  async listBackups(): Promise<string[]> {
    return this.listFiles('backups/');
  }
}
