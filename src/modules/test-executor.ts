import { TestCase, TestResult } from '../types';
import { Logger } from '../utils/logger';
import { ShellExecutor } from '../utils/shell';

/**
 * Unified test execution engine for manual and automated tests
 */
export class TestExecutor {
  private logger: Logger;
  private shell: ShellExecutor;

  constructor() {
    this.logger = new Logger();
    this.shell = new ShellExecutor();
  }

  /**
   * Execute a test case (manual or automated)
   */
  async executeTest(testCase: TestCase, executedBy: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      if (testCase.type === 'automated') {
        return await this.executeAutomatedTest(testCase, executedBy, startTime);
      } else {
        return await this.executeManualTest(testCase, executedBy, startTime);
      }
    } catch (error) {
      return {
        id: `result-${Date.now()}`,
        testId: testCase.id,
        executedAt: new Date(),
        executedBy,
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute automated test script
   */
  private async executeAutomatedTest(
    testCase: TestCase,
    executedBy: string,
    startTime: number
  ): Promise<TestResult> {
    if (!testCase.automatedScript) {
      throw new Error('No automated script defined');
    }

    Logger.info(`Executing automated test: ${testCase.name}`);

    try {
      const result = await this.shell.execute(testCase.automatedScript);
      
      return {
        id: `result-${Date.now()}`,
        testId: testCase.id,
        executedAt: new Date(),
        executedBy,
        status: result.code === 0 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        logs: [result.stdout, result.stderr].filter(Boolean),
      };
    } catch (error) {
      throw new Error(`Script execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Guide manual test execution
   */
  private async executeManualTest(
    testCase: TestCase,
    executedBy: string,
    startTime: number
  ): Promise<TestResult> {
    if (!testCase.steps || testCase.steps.length === 0) {
      throw new Error('No manual test steps defined');
    }

    Logger.info(`Starting manual test: ${testCase.name}`);
    
    // In a real implementation, this would interact with a UI
    // For now, we'll mark it as pending manual execution
    return {
      id: `result-${Date.now()}`,
      testId: testCase.id,
      executedAt: new Date(),
      executedBy,
      status: 'blocked',
      duration: Date.now() - startTime,
      logs: ['Manual test requires human execution'],
    };
  }

  /**
   * Execute multiple tests in parallel
   */
  async executeBatch(
    testCases: TestCase[],
    executedBy: string,
    parallel: boolean = false
  ): Promise<TestResult[]> {
    if (parallel) {
      return Promise.all(
        testCases.map(test => this.executeTest(test, executedBy))
      );
    } else {
      const results: TestResult[] = [];
      for (const test of testCases) {
        results.push(await this.executeTest(test, executedBy));
      }
      return results;
    }
  }

  /**
   * Execute all tests for a specific story
   */
  async executeStoryTests(
    tests: TestCase[],
    executedBy: string
  ): Promise<Map<string, TestResult>> {
    const results = new Map<string, TestResult>();
    
    for (const test of tests) {
      const result = await this.executeTest(test, executedBy);
      results.set(test.id, result);
    }

    return results;
  }
}
