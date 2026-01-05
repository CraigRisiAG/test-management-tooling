/**
 * @file dynamodb-client.ts
 * @description DynamoDB client wrapper for single-table design
 * Provides type-safe operations for test management data
 * 
 * Supported Entity Types:
 * - TEST: Test cases
 * - STORY: User stories
 * - EPIC: Epic collections
 * - FEATURE: Feature deliverables
 * - GOAL: Strategic goals
 * - PORTFOLIO: Portfolio objectives
 * - ISSUE: Issues and defects
 * - USER: User accounts
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

export type EntityType = 
  | 'TEST' 
  | 'STORY' 
  | 'EPIC' 
  | 'FEATURE' 
  | 'GOAL' 
  | 'PORTFOLIO' 
  | 'ISSUE' 
  | 'USER' 
  | 'SPRINT' 
  | 'BOARD'
  | 'ORGANIZATION'
  | 'SEGMENT'
  | 'DEPARTMENT'
  | 'TEAM'
  | 'TEAM_MEMBER'
  | 'RESOURCE_PERMISSION'
  | 'ACCESS_REQUEST';

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

  /**
   * Query child items by parent relationship
   * Example: Get all EPICs for a FEATURE, or all STORYs for an EPIC
   */
  async queryByParent(childType: EntityType, parentIdField: string, parentId: string): Promise<any[]> {
    return this.queryWithFilter(
      childType,
      `${parentIdField} = :parentId`,
      { ':parentId': parentId }
    );
  }

  /**
   * Get hierarchy: Portfolio → Goals → Features → Epics → Stories
   */
  async getAgileHierarchy(portfolioId?: string, goalId?: string, featureId?: string, epicId?: string): Promise<any> {
    const hierarchy: any = {};

    if (portfolioId) {
      hierarchy.portfolio = await this.getItem('PORTFOLIO', portfolioId);
      const goals = await this.queryByParent('GOAL', 'portfolioObjectiveId', portfolioId);
      hierarchy.goals = goals;

      for (const goal of goals) {
        const features = await this.queryByParent('FEATURE', 'goalId', goal.id);
        hierarchy.features = [...(hierarchy.features || []), ...features];
      }
    } else if (goalId) {
      hierarchy.goal = await this.getItem('GOAL', goalId);
      hierarchy.features = await this.queryByParent('FEATURE', 'goalId', goalId);
    } else if (featureId) {
      hierarchy.feature = await this.getItem('FEATURE', featureId);
      hierarchy.epics = await this.queryByParent('EPIC', 'featureId', featureId);
    } else if (epicId) {
      hierarchy.epic = await this.getItem('EPIC', epicId);
      hierarchy.stories = await this.queryByParent('STORY', 'epicId', epicId);
    }

    return hierarchy;
  }

  /**
   * Get complete lineage for a story (Story → Epic → Feature → Goal → Portfolio)
   */
  async getStoryLineage(storyId: string): Promise<any> {
    const story = await this.getItem('STORY', storyId);
    if (!story) return null;

    const lineage: any = { story };

    if (story.epicId) {
      const epic = await this.getItem('EPIC', story.epicId);
      lineage.epic = epic;

      if (epic?.featureId) {
        const feature = await this.getItem('FEATURE', epic.featureId);
        lineage.feature = feature;

        if (feature?.goalId) {
          const goal = await this.getItem('GOAL', feature.goalId);
          lineage.goal = goal;

          if (goal?.portfolioObjectiveId) {
            const portfolio = await this.getItem('PORTFOLIO', goal.portfolioObjectiveId);
            lineage.portfolio = portfolio;
          }
        }
      }
    }

    return lineage;
  }
}
