/**
 * @file dynamodb-client.ts
 * @description DynamoDB client wrapper for single-table design
 * Provides type-safe operations for test management data
 */

import {
  DynamoDBClient as AWSDynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  QueryCommand,
  BatchWriteItemCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface DynamoDBConfig {
  tableName: string;
  region: string;
  endpoint?: string; // For local testing
}

export class DynamoDBClient {
  private client: AWSDynamoDBClient;
  private tableName: string;

  constructor(config: DynamoDBConfig) {
    this.tableName = config.tableName;
    
    this.client = new AWSDynamoDBClient({
      region: config.region,
      ...(config.endpoint && { endpoint: config.endpoint })
    });
  }

  async initialize(): Promise<void> {
    try {
      // Verify table exists
      const command = new DescribeTableCommand({ TableName: this.tableName });
      await this.client.send(command);
      console.log(`✅ DynamoDB table verified: ${this.tableName}`);
    } catch (error: any) {
      console.error(`❌ Failed to verify DynamoDB table: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a single item by type and ID
   * Pattern: PK = TYPE#ID, SK = METADATA
   */
  async getItem(type: string, id: string): Promise<any | null> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({
        PK: `${type}#${id}`,
        SK: 'METADATA'
      })
    });

    try {
      const result = await this.client.send(command);
      return result.Item ? unmarshall(result.Item) : null;
    } catch (error: any) {
      console.error(`Error getting item ${type}#${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Put (create or update) an item
   */
  async putItem(type: string, id: string, data: any): Promise<void> {
    const item = {
      PK: `${type}#${id}`,
      SK: 'METADATA',
      Type: type,
      GSI1PK: type, // For querying by type
      GSI1SK: id,
      ...data
    };

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item)
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      console.error(`Error putting item ${type}#${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(type: string, id: string): Promise<void> {
    const command = new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({
        PK: `${type}#${id}`,
        SK: 'METADATA'
      })
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      console.error(`Error deleting item ${type}#${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Query all items of a specific type
   * Uses GSI1 (TypeIndex) for efficient queries
   */
  async queryByType(type: string, limit?: number): Promise<any[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TypeIndex',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: marshall({
        ':type': type
      }),
      ...(limit && { Limit: limit })
    });

    try {
      const result = await this.client.send(command);
      return result.Items ? result.Items.map(item => unmarshall(item)) : [];
    } catch (error: any) {
      console.error(`Error querying type ${type}:`, error.message);
      throw error;
    }
  }

  /**
   * Batch write operations (up to 25 items)
   */
  async batchWrite(items: { type: string; id: string; data: any }[]): Promise<void> {
    const putRequests = items.map(({ type, id, data }) => ({
      PutRequest: {
        Item: marshall({
          PK: `${type}#${id}`,
          SK: 'METADATA',
          Type: type,
          GSI1PK: type,
          GSI1SK: id,
          ...data
        })
      }
    }));

    // Split into batches of 25 (DynamoDB limit)
    for (let i = 0; i < putRequests.length; i += 25) {
      const batch = putRequests.slice(i, i + 25);
      
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [this.tableName]: batch
        }
      });

      try {
        await this.client.send(command);
      } catch (error: any) {
        console.error(`Error batch writing items:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Query with custom filter expression
   */
  async queryWithFilter(
    type: string,
    filterExpression: string,
    expressionAttributeValues: Record<string, any>
  ): Promise<any[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TypeIndex',
      KeyConditionExpression: 'GSI1PK = :type',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: marshall({
        ':type': type,
        ...expressionAttributeValues
      })
    });

    try {
      const result = await this.client.send(command);
      return result.Items ? result.Items.map(item => unmarshall(item)) : [];
    } catch (error: any) {
      console.error(`Error querying with filter:`, error.message);
      throw error;
    }
  }
}
