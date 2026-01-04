import {
  Issue,
  IssueComment,
  IssueFilter,
  IssueMetrics,
} from '../types';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Issue Management Module
 * Handles creation, tracking, and resolution of issues
 */
export class IssueManager {
  private issues: Map<string, Issue> = new Map();
  private logger: Logger;
  private dataDir: string;
  private issuesFile: string;

  constructor(dataDir: string = './test-data') {
    this.logger = new Logger('info');
    this.dataDir = dataDir;
    this.issuesFile = path.join(dataDir, 'issues.json');
  }

  /**
   * Initialize issue manager and load existing issues
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadIssues();
      this.logger.info('Issue manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize issue manager', error as Error);
      throw error;
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(issue: Omit<Issue, 'id' | 'comments'>): Promise<Issue> {
    const newIssue: Issue = {
      ...issue,
      id: `ISSUE-${Date.now()}`,
      comments: [],
    };

    this.issues.set(newIssue.id, newIssue);
    await this.saveIssues();
    this.logger.info(`Issue created: ${newIssue.id}`);

    return newIssue;
  }

  /**
   * Get issue by ID
   */
  getIssue(issueId: string): Issue | undefined {
    return this.issues.get(issueId);
  }

  /**
   * Get all issues
   */
  getAllIssues(): Issue[] {
    return Array.from(this.issues.values());
  }

  /**
   * Update issue status
   */
  async updateStatus(issueId: string, status: Issue['status']): Promise<void> {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.status = status;
    issue.updatedAt = new Date();

    if (status === 'resolved' || status === 'closed') {
      issue.resolvedAt = new Date();
    }

    await this.saveIssues();
    this.logger.info(`Issue ${issueId} status updated to: ${status}`);
  }

  /**
   * Link issue to test
   */
  async linkToTest(issueId: string, testId: string): Promise<void> {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (!issue.linkedTests.includes(testId)) {
      issue.linkedTests.push(testId);
      await this.saveIssues();
      this.logger.info(`Test ${testId} linked to issue ${issueId}`);
    }
  }

  /**
   * Link issue to story
   */
  async linkToStory(issueId: string, storyId: string): Promise<void> {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (!issue.linkedStories.includes(storyId)) {
      issue.linkedStories.push(storyId);
      await this.saveIssues();
      this.logger.info(`Story ${storyId} linked to issue ${issueId}`);
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueId: string, comment: Omit<IssueComment, 'id'>): Promise<void> {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const newComment: IssueComment = {
      ...comment,
      id: `comment-${Date.now()}`,
    };

    issue.comments.push(newComment);
    issue.updatedAt = new Date();
    await this.saveIssues();
    this.logger.info(`Comment added to issue ${issueId}`);
  }

  /**
   * Assign issue
   */
  async assign(issueId: string, assignee: string): Promise<void> {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.assignee = assignee;
    issue.updatedAt = new Date();
    await this.saveIssues();
    this.logger.info(`Issue ${issueId} assigned to ${assignee}`);
  }

  /**
   * Filter issues
   */
  filterIssues(filter: IssueFilter): Issue[] {
    let results = Array.from(this.issues.values());

    if (filter.type) {
      results = results.filter(issue => issue.type === filter.type);
    }

    if (filter.severity) {
      results = results.filter(issue => issue.severity === filter.severity);
    }

    if (filter.priority) {
      results = results.filter(issue => issue.priority === filter.priority);
    }

    if (filter.status) {
      results = results.filter(issue => issue.status === filter.status);
    }

    if (filter.assignee) {
      results = results.filter(issue => issue.assignee === filter.assignee);
    }

    if (filter.linkedTest) {
      results = results.filter(issue => issue.linkedTests.includes(filter.linkedTest!));
    }

    if (filter.linkedStory) {
      results = results.filter(issue => issue.linkedStories.includes(filter.linkedStory!));
    }

    if (filter.createdAfter) {
      results = results.filter(issue => issue.createdAt > filter.createdAfter!);
    }

    if (filter.createdBefore) {
      results = results.filter(issue => issue.createdAt < filter.createdBefore!);
    }

    return results;
  }

  /**
   * Get issue metrics
   */
  getMetrics(): IssueMetrics {
    const issues = Array.from(this.issues.values());

    const metrics: IssueMetrics = {
      totalIssues: issues.length,
      openIssues: issues.filter(i => i.status === 'open' || i.status === 'reopened').length,
      closedIssues: issues.filter(i => i.status === 'closed').length,
      criticalCount: issues.filter(i => i.severity === 'critical').length,
      majorCount: issues.filter(i => i.severity === 'major').length,
      minorCount: issues.filter(i => i.severity === 'minor').length,
      issuesByStatus: this.groupBy(issues, 'status'),
      issuesBySeverity: this.groupBy(issues, 'severity'),
    };

    // Calculate average resolution time
    const resolvedIssues = issues.filter(i => i.resolvedAt);
    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((sum, issue) => {
        const time = issue.resolvedAt!.getTime() - issue.createdAt.getTime();
        return sum + time;
      }, 0);
      metrics.averageResolutionTime = Math.round(totalTime / resolvedIssues.length / 1000 / 60 / 60); // Hours
    }

    return metrics;
  }

  private groupBy(items: Issue[], key: keyof Issue): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async loadIssues(): Promise<void> {
    try {
      const data = await fs.readFile(this.issuesFile, 'utf-8');
      const issues: Issue[] = JSON.parse(data);
      issues.forEach(issue => this.issues.set(issue.id, issue));
      this.logger.debug(`Loaded ${issues.length} issues`);
    } catch (error) {
      this.logger.debug('No existing issues found');
    }
  }

  private async saveIssues(): Promise<void> {
    const issues = Array.from(this.issues.values());
    await fs.writeFile(this.issuesFile, JSON.stringify(issues, null, 2));
  }
}
