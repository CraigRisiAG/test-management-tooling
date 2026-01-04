import { TestCase, UserStory, CodeReference, TraceabilityMatrix } from '../types';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Central registry for managing test-story-code relationships
 */
export class TestRegistry {
  private stories: Map<string, UserStory> = new Map();
  private tests: Map<string, TestCase> = new Map();
  private logger: Logger;
  private dataDir: string;

  constructor(dataDir: string = './test-data') {
    this.logger = new Logger('info');
    this.dataDir = dataDir;
  }

  /**
   * Initialize registry and load existing data
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadStories();
      await this.loadTests();
      this.logger.info('Test registry initialized');
    } catch (error) {
      this.logger.error('Failed to initialize registry', error as Error);
      throw error;
    }
  }

  /**
   * Register a new user story
   */
  async registerStory(story: UserStory): Promise<void> {
    this.stories.set(story.id, story);
    await this.saveStories();
    this.logger.info(`Story registered: ${story.id}`);
  }

  /**
   * Link test case to user story and code
   */
  async linkTest(testCase: TestCase): Promise<void> {
    if (!this.stories.has(testCase.storyId)) {
      throw new Error(`Story ${testCase.storyId} not found`);
    }

    this.tests.set(testCase.id, testCase);

    const story = this.stories.get(testCase.storyId)!;
    if (!story.linkedTests.includes(testCase.id)) {
      story.linkedTests.push(testCase.id);
      await this.saveStories();
    }

    await this.saveTests();
    this.logger.info(`Test linked: ${testCase.id} -> Story: ${testCase.storyId}`);
  }

  /**
   * Link code references to story
   */
  async linkCodeToStory(storyId: string, codeRef: CodeReference): Promise<void> {
    const story = this.stories.get(storyId);
    if (!story) {
      throw new Error(`Story ${storyId} not found`);
    }

    story.linkedCode.push(codeRef);
    story.updatedAt = new Date();
    await this.saveStories();
    this.logger.info(`Code linked to story ${storyId}: ${codeRef.filePath}`);
  }

  /**
   * Generate traceability matrix
   */
  generateTraceabilityMatrix(): TraceabilityMatrix[] {
    const matrix: TraceabilityMatrix[] = [];

    for (const [storyId, story] of this.stories) {
      const testCases = story.linkedTests;
      const codeFiles = story.linkedCode.map(ref => ref.filePath);
      const coveragePercentage = this.calculateCoverage(story);

      matrix.push({
        storyId,
        testCases,
        codeFiles,
        coveragePercentage,
      });
    }

    return matrix;
  }

  /**
   * Get all tests for a story
   */
  getTestsForStory(storyId: string): TestCase[] {
    const story = this.stories.get(storyId);
    if (!story) return [];

    return story.linkedTests
      .map(testId => this.tests.get(testId))
      .filter(test => test !== undefined) as TestCase[];
  }

  /**
   * Get all stories
   */
  getAllStories(): UserStory[] {
    return Array.from(this.stories.values());
  }

  /**
   * Get all tests
   */
  getAllTests(): TestCase[] {
    return Array.from(this.tests.values());
  }

  /**
   * Get story by ID
   */
  getStory(storyId: string): UserStory | undefined {
    return this.stories.get(storyId);
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): TestCase | undefined {
    return this.tests.get(testId);
  }

  /**
   * Update story status
   */
  async updateStoryStatus(storyId: string, status: UserStory['status']): Promise<void> {
    const story = this.stories.get(storyId);
    if (!story) {
      throw new Error(`Story ${storyId} not found`);
    }

    story.status = status;
    story.updatedAt = new Date();
    await this.saveStories();
    this.logger.info(`Story ${storyId} status updated to: ${status}`);
  }

  /**
   * Update test status
   */
  async updateTestStatus(testId: string, status: TestCase['status']): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = status;
    await this.saveTests();
    this.logger.info(`Test ${testId} status updated to: ${status}`);
  }

  private calculateCoverage(story: UserStory): number {
    const hasTests = story.linkedTests.length > 0;
    const hasCode = story.linkedCode.length > 0;
    const testsPass = story.linkedTests.every(testId => {
      const test = this.tests.get(testId);
      return test && test.status === 'passed';
    });

    if (!hasTests && !hasCode) return 0;
    if (hasTests && hasCode && testsPass) return 100;
    if (hasTests || hasCode) return 50;
    return 0;
  }

  private async loadStories(): Promise<void> {
    const storiesPath = path.join(this.dataDir, 'stories.json');
    try {
      const data = await fs.readFile(storiesPath, 'utf-8');
      const stories: UserStory[] = JSON.parse(data);
      stories.forEach(story => this.stories.set(story.id, story));
    } catch (error) {
      this.logger.debug('No existing stories found');
    }
  }

  private async loadTests(): Promise<void> {
    const testsPath = path.join(this.dataDir, 'tests.json');
    try {
      const data = await fs.readFile(testsPath, 'utf-8');
      const tests: TestCase[] = JSON.parse(data);
      tests.forEach(test => this.tests.set(test.id, test));
    } catch (error) {
      this.logger.debug('No existing tests found');
    }
  }

  private async saveStories(): Promise<void> {
    const storiesPath = path.join(this.dataDir, 'stories.json');
    const stories = Array.from(this.stories.values());
    await fs.writeFile(storiesPath, JSON.stringify(stories, null, 2));
  }

  private async saveTests(): Promise<void> {
    const testsPath = path.join(this.dataDir, 'tests.json');
    const tests = Array.from(this.tests.values());
    await fs.writeFile(testsPath, JSON.stringify(tests, null, 2));
  }
}
