import { TraceabilityMatrix, UserStory, TestCase } from '../types';
import { TestRegistry } from './test-registry';
import * as fs from 'fs/promises';
import { Logger } from '../utils/logger';

/**
 * Generates HTML dashboard with traceability matrix and test results
 */
export class DashboardReporter {
  private registry: TestRegistry;
  private logger: Logger;

  constructor(registry: TestRegistry) {
    this.registry = registry;
    this.logger = new Logger('info');
  }

  /**
   * Generate HTML dashboard
   */
  async generateDashboard(outputPath: string): Promise<void> {
    const matrix = this.registry.generateTraceabilityMatrix();
    const stories = this.registry.getAllStories();
    const tests = this.registry.getAllTests();
    
    const html = this.createHTML(matrix, stories, tests);
    await fs.writeFile(outputPath, html);
    this.logger.info(`Dashboard generated: ${outputPath}`);
  }

  /**
   * Generate JSON report
   */
  async generateJsonReport(outputPath: string): Promise<void> {
    const matrix = this.registry.generateTraceabilityMatrix();
    const stories = this.registry.getAllStories();
    const tests = this.registry.getAllTests();

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStories: stories.length,
        totalTests: tests.length,
        passedTests: tests.filter(t => t.status === 'passed').length,
        failedTests: tests.filter(t => t.status === 'failed').length,
        blockedTests: tests.filter(t => t.status === 'blocked').length,
      },
      traceabilityMatrix: matrix,
      stories,
      tests,
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    this.logger.info(`JSON report generated: ${outputPath}`);
  }

  private createHTML(matrix: TraceabilityMatrix[], stories: UserStory[], tests: TestCase[]): string {
    const summary = {
      totalStories: stories.length,
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'passed').length,
      failedTests: tests.filter(t => t.status === 'failed').length,
      blockedTests: tests.filter(t => t.status === 'blocked').length,
      pendingTests: tests.filter(t => t.status === 'pending').length,
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Management Dashboard</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h3 { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 10px; }
    .card .value { font-size: 36px; font-weight: bold; }
    .card.passed .value { color: #27ae60; }
    .card.failed .value { color: #e74c3c; }
    .card.blocked .value { color: #f39c12; }
    .card.pending .value { color: #3498db; }
    .matrix-container { margin: 30px 0; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { padding: 16px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; color: #333; }
    tr:hover { background: #f8f9fa; }
    .coverage { text-align: center; font-weight: bold; padding: 8px 16px; border-radius: 4px; display: inline-block; min-width: 60px; }
    .coverage-100 { background: #27ae60; color: white; }
    .coverage-50 { background: #f39c12; color: white; }
    .coverage-0 { background: #e74c3c; color: white; }
    .story-link { color: #667eea; cursor: pointer; text-decoration: none; font-weight: 500; }
    .story-link:hover { text-decoration: underline; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 2px; }
    .badge.passed { background: #d4edda; color: #155724; }
    .badge.failed { background: #f8d7da; color: #721c24; }
    .badge.pending { background: #d1ecf1; color: #0c5460; }
    .badge.blocked { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>📊 Test Management Dashboard</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <div class="container">
    <div class="summary">
      <div class="card">
        <h3>Total Stories</h3>
        <div class="value">${summary.totalStories}</div>
      </div>
      <div class="card">
        <h3>Total Tests</h3>
        <div class="value">${summary.totalTests}</div>
      </div>
      <div class="card passed">
        <h3>Passed</h3>
        <div class="value">${summary.passedTests}</div>
      </div>
      <div class="card failed">
        <h3>Failed</h3>
        <div class="value">${summary.failedTests}</div>
      </div>
      <div class="card blocked">
        <h3>Blocked</h3>
        <div class="value">${summary.blockedTests}</div>
      </div>
      <div class="card pending">
        <h3>Pending</h3>
        <div class="value">${summary.pendingTests}</div>
      </div>
    </div>

    <div class="matrix-container">
      <div class="card">
        <h2 style="margin-bottom: 20px;">Traceability Matrix</h2>
        <table>
          <thead>
            <tr>
              <th>Story ID</th>
              <th>Title</th>
              <th>Test Cases</th>
              <th>Code Files</th>
              <th>Status</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            ${matrix.map(item => {
              const story = stories.find(s => s.id === item.storyId);
              return `
                <tr>
                  <td><a class="story-link" href="#${item.storyId}">${item.storyId}</a></td>
                  <td>${story?.title || 'N/A'}</td>
                  <td>${item.testCases.length} tests</td>
                  <td>${item.codeFiles.length} files</td>
                  <td><span class="badge ${story?.status || 'pending'}">${story?.status || 'N/A'}</span></td>
                  <td>
                    <span class="coverage coverage-${item.coveragePercentage}">
                      ${item.coveragePercentage}%
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="matrix-container">
      <div class="card">
        <h2 style="margin-bottom: 20px;">All Tests</h2>
        <table>
          <thead>
            <tr>
              <th>Test ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Story</th>
              <th>Status</th>
              <th>Last Run</th>
            </tr>
          </thead>
          <tbody>
            ${tests.map(test => `
              <tr>
                <td>${test.id}</td>
                <td>${test.name}</td>
                <td><span class="badge">${test.type}</span></td>
                <td><a class="story-link" href="#${test.storyId}">${test.storyId}</a></td>
                <td><span class="badge ${test.status}">${test.status}</span></td>
                <td>${test.lastRun ? new Date(test.lastRun).toLocaleString() : 'Never'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
