#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TestRegistry } from './modules/test-registry';
import { TestExecutor } from './modules/test-executor';
import { CodeTracer } from './modules/code-tracer';
import { DashboardReporter } from './modules/dashboard-reporter';
import { IssueManager } from './modules/issue-manager';
import { DefectManager } from './modules/defect-manager';
import { GitOpsModule } from './modules/gitops';
import { AgileModule } from './modules/agile';
import { Logger } from './utils/logger';
import type { UserStory, TestCase, CodeReference, Issue, Defect } from './types';

/**
 * Custom Test Management CLI - Main Entry Point
 */

const program = new Command();

program
  .name('testmgr')
  .description('Custom Test Management Platform - Link stories, tests, and code')
  .version('1.0.0')
  .option('--debug', 'Enable debug logging')
  .option('--data-dir <dir>', 'Data directory for test registry', './test-data')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
      Logger.enableDebug();
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize test management system in current directory')
  .action(async () => {
    try {
      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();
      
      Logger.success(`Test management initialized in: ${dataDir}`);
      Logger.info('You can now create user stories and link tests!');
      Logger.info('');
      Logger.info('Quick start:');
      Logger.info('  testmgr story create      - Create a new user story');
      Logger.info('  testmgr test link         - Link a test to a story');
      Logger.info('  testmgr dashboard         - Generate dashboard');
    } catch (error) {
      Logger.error(`Initialization failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Story commands
const storyCmd = program
  .command('story')
  .description('Manage user stories');

storyCmd
  .command('create')
  .description('Create a new user story')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'Story ID (e.g., US-001):',
          validate: (input: string) => input.length > 0 || 'ID is required',
        },
        {
          type: 'input',
          name: 'title',
          message: 'Story title:',
          validate: (input: string) => input.length > 0 || 'Title is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
        },
        {
          type: 'input',
          name: 'acceptanceCriteria',
          message: 'Acceptance criteria (comma-separated):',
        },
      ]);

      const story: UserStory = {
        id: answers.id,
        title: answers.title,
        description: answers.description,
        acceptanceCriteria: answers.acceptanceCriteria.split(',').map((s: string) => s.trim()),
        status: 'draft',
        linkedTests: [],
        linkedCode: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();
      await registry.registerStory(story);

      Logger.success(`Story ${story.id} created successfully!`);
    } catch (error) {
      Logger.error(`Failed to create story: ${(error as Error).message}`);
      process.exit(1);
    }
  });

storyCmd
  .command('list')
  .description('List all user stories')
  .action(async () => {
    try {
      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();
      
      const stories = registry.getAllStories();
      
      if (stories.length === 0) {
        Logger.warn('No stories found. Create one with: testmgr story create');
        return;
      }

      console.log(chalk.bold('\nUser Stories:\n'));
      stories.forEach(story => {
        console.log(chalk.cyan(`${story.id}`) + ` - ${story.title}`);
        console.log(`  Status: ${chalk.yellow(story.status)}`);
        console.log(`  Tests: ${story.linkedTests.length}`);
        console.log(`  Code files: ${story.linkedCode.length}`);
        console.log('');
      });
    } catch (error) {
      Logger.error(`Failed to list stories: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Test commands
const testCmd = program
  .command('test')
  .description('Manage test cases');

testCmd
  .command('link')
  .description('Link a test to a user story')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'testId',
          message: 'Test ID (e.g., TEST-001):',
          validate: (input: string) => input.length > 0 || 'Test ID is required',
        },
        {
          type: 'input',
          name: 'storyId',
          message: 'Story ID to link to:',
          validate: (input: string) => input.length > 0 || 'Story ID is required',
        },
        {
          type: 'input',
          name: 'name',
          message: 'Test name:',
          validate: (input: string) => input.length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Test description:',
        },
        {
          type: 'list',
          name: 'type',
          message: 'Test type:',
          choices: ['automated', 'manual'],
        },
        {
          type: 'input',
          name: 'automatedScript',
          message: 'Automated test script (leave empty for manual):',
          when: (answers) => answers.type === 'automated',
        },
      ]);

      const testCase: TestCase = {
        id: answers.testId,
        storyId: answers.storyId,
        name: answers.name,
        description: answers.description,
        type: answers.type,
        status: 'pending',
        automatedScript: answers.automatedScript,
        codeReferences: [],
        results: [],
      };

      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();
      await registry.linkTest(testCase);

      Logger.success(`Test ${testCase.id} linked to story ${testCase.storyId}!`);
    } catch (error) {
      Logger.error(`Failed to link test: ${(error as Error).message}`);
      process.exit(1);
    }
  });

testCmd
  .command('run <testId>')
  .description('Execute a test')
  .option('-e, --executor <name>', 'Executor name', 'cli-user')
  .action(async (testId: string, options) => {
    try {
      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();

      const test = registry.getTest(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      Logger.info(`Executing test: ${test.name}`);
      
      const executor = new TestExecutor();
      const result = await executor.executeTest(test, options.executor);

      console.log('');
      console.log(chalk.bold('Test Result:'));
      console.log(`  Status: ${result.status === 'passed' ? chalk.green(result.status) : chalk.red(result.status)}`);
      console.log(`  Duration: ${result.duration}ms`);
      if (result.error) {
        console.log(`  Error: ${chalk.red(result.error)}`);
      }
    } catch (error) {
      Logger.error(`Test execution failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Code linking command
program
  .command('link-code')
  .description('Link code to a user story')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'storyId',
          message: 'Story ID:',
          validate: (input: string) => input.length > 0 || 'Story ID is required',
        },
        {
          type: 'input',
          name: 'filePath',
          message: 'File path (relative to workspace):',
          validate: (input: string) => input.length > 0 || 'File path is required',
        },
        {
          type: 'number',
          name: 'lineStart',
          message: 'Start line number:',
          validate: (input: number) => input > 0 || 'Must be greater than 0',
        },
        {
          type: 'number',
          name: 'lineEnd',
          message: 'End line number:',
          validate: (input: number) => input > 0 || 'Must be greater than 0',
        },
      ]);

      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();

      const tracer = new CodeTracer(process.cwd());
      const codeRef = await tracer.createReference(
        answers.filePath,
        answers.lineStart,
        answers.lineEnd
      );

      await registry.linkCodeToStory(answers.storyId, codeRef);

      Logger.success(`Code linked to story ${answers.storyId}!`);
      if (codeRef.functionName) {
        Logger.info(`  Function: ${codeRef.functionName}`);
      }
      if (codeRef.className) {
        Logger.info(`  Class: ${codeRef.className}`);
      }
    } catch (error) {
      Logger.error(`Failed to link code: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Dashboard command
program
  .command('dashboard')
  .description('Generate test management dashboard')
  .option('-o, --output <file>', 'Output file path', './dashboard.html')
  .option('--json', 'Generate JSON report instead of HTML')
  .action(async (options) => {
    try {
      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();

      const reporter = new DashboardReporter(registry);
      
      if (options.json) {
        const jsonPath = options.output.replace('.html', '.json');
        await reporter.generateJsonReport(jsonPath);
        Logger.success(`JSON report generated: ${jsonPath}`);
      } else {
        await reporter.generateDashboard(options.output);
        Logger.success(`Dashboard generated: ${options.output}`);
        Logger.info('Open the file in your browser to view the dashboard');
      }
    } catch (error) {
      Logger.error(`Dashboard generation failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Matrix command
program
  .command('matrix')
  .description('Show traceability matrix')
  .action(async () => {
    try {
      const dataDir = program.opts().dataDir || './test-data';
      const registry = new TestRegistry(dataDir);
      await registry.initialize();

      const matrix = registry.generateTraceabilityMatrix();

      console.log(chalk.bold('\nTraceability Matrix:\n'));
      console.log(
        chalk.gray('Story ID'.padEnd(15)) +
        chalk.gray('Tests'.padEnd(10)) +
        chalk.gray('Code Files'.padEnd(15)) +
        chalk.gray('Coverage')
      );
      console.log('-'.repeat(60));

      matrix.forEach(item => {
        const coverageColor = 
          item.coveragePercentage === 100 ? chalk.green :
          item.coveragePercentage >= 50 ? chalk.yellow :
          chalk.red;

        console.log(
          item.storyId.padEnd(15) +
          `${item.testCases.length}`.padEnd(10) +
          `${item.codeFiles.length}`.padEnd(15) +
          coverageColor(`${item.coveragePercentage}%`)
        );
      });

      console.log('');
    } catch (error) {
      Logger.error(`Failed to show matrix: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Keep GitOps and Agile modules
const gitopsCmd = program
  .command('gitops')
  .description('Git operations and repository management');

gitopsCmd
  .command('sync <path>')
  .description('Sync repository (pull + push)')
  .action(async (repoPath: string) => {
    try {
      const gitops = new GitOpsModule();
      await gitops.sync(repoPath);
      Logger.success('Repository synced successfully');
    } catch (error) {
      Logger.error(`Sync failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// ========================================
// Issue Management
// ========================================

const issueCmd = program
  .command('issue')
  .description('Issue and bug tracking');

issueCmd
  .command('create')
  .description('Create a new issue')
  .action(async () => {
    const issueManager = new IssueManager();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Issue title:',
        validate: (v) => v.length > 0 || 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Issue description:'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Issue type:',
        choices: ['bug', 'defect', 'enhancement', 'task']
      },
      {
        type: 'list',
        name: 'severity',
        message: 'Severity level:',
        choices: ['critical', 'major', 'minor', 'trivial']
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['P0', 'P1', 'P2', 'P3']
      },
      {
        type: 'input',
        name: 'assignee',
        message: 'Assignee (optional):'
      }
    ]);

    try {
      const issue = await issueManager.createIssue({
        title: answers.title,
        description: answers.description,
        type: answers.type,
        severity: answers.severity,
        priority: answers.priority,
        assignee: answers.assignee || undefined,
        status: 'open',
        createdDate: new Date()
      });

      Logger.success(`✓ Issue created: ${issue.id} (${chalk.cyan(issue.title)})`);
    } catch (error) {
      Logger.error(`Failed to create issue: ${(error as Error).message}`);
    }
  });

issueCmd
  .command('list')
  .option('--status <status>', 'Filter by status (open, in-progress, resolved, closed)')
  .option('--severity <severity>', 'Filter by severity')
  .option('--assigned-to <user>', 'Filter by assignee')
  .description('List all issues with optional filters')
  .action(async (options) => {
    const issueManager = new IssueManager();

    try {
      const issues = issueManager.filterIssues({
        status: options.status ? [options.status] : undefined,
        severity: options.severity ? [options.severity] : undefined,
        assignee: options.assignedTo
      });

      if (issues.length === 0) {
        Logger.info('No issues found');
        return;
      }

      console.log('');
      console.log(chalk.bold('Issues:'));
      console.log(chalk.dim('─'.repeat(120)));

      issues.forEach((issue) => {
        const statusColor = issue.status === 'open' ? 'red' : issue.status === 'in-progress' ? 'yellow' : 'green';
        console.log(
          `${chalk.cyan(issue.id)} | ${chalk.bold(issue.title)} | ${chalk[statusColor](issue.status)} | ${chalk.dim(issue.severity)}`
        );
        if (issue.assignee) {
          console.log(`  Assigned to: ${issue.assignee}`);
        }
      });

      console.log(chalk.dim('─'.repeat(120)));
      Logger.info(`Total: ${issues.length} issues`);
    } catch (error) {
      Logger.error(`Failed to list issues: ${(error as Error).message}`);
    }
  });

issueCmd
  .command('assign <issue-id> <assignee>')
  .description('Assign an issue to a developer')
  .action(async (issueId: string, assignee: string) => {
    const issueManager = new IssueManager();

    try {
      await issueManager.assign(issueId, assignee);
      Logger.success(`✓ Issue ${issueId} assigned to ${assignee}`);
    } catch (error) {
      Logger.error(`Failed to assign issue: ${(error as Error).message}`);
    }
  });

issueCmd
  .command('comment <issue-id>')
  .description('Add a comment to an issue')
  .action(async (issueId: string) => {
    const issueManager = new IssueManager();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Your comment:',
        validate: (v) => v.length > 0 || 'Comment cannot be empty'
      }
    ]);

    try {
      await issueManager.addComment(issueId, {
        text: answers.text,
        author: 'CLI User',
        date: new Date()
      });
      Logger.success(`✓ Comment added to issue ${issueId}`);
    } catch (error) {
      Logger.error(`Failed to add comment: ${(error as Error).message}`);
    }
  });

issueCmd
  .command('status <issue-id> <new-status>')
  .description('Update issue status (open, in-progress, resolved, closed)')
  .action(async (issueId: string, newStatus: string) => {
    const issueManager = new IssueManager();

    try {
      await issueManager.updateStatus(issueId, newStatus as Issue['status']);
      Logger.success(`✓ Issue ${issueId} status updated to ${newStatus}`);
    } catch (error) {
      Logger.error(`Failed to update status: ${(error as Error).message}`);
    }
  });

// ========================================
// Defect Management
// ========================================

const defectCmd = program
  .command('defect')
  .description('Defect tracking and management');

defectCmd
  .command('create')
  .description('Create a new defect')
  .action(async () => {
    const defectManager = new DefectManager();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Defect title:',
        validate: (v) => v.length > 0 || 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Defect description:'
      },
      {
        type: 'list',
        name: 'severity',
        message: 'Severity:',
        choices: ['critical', 'major', 'minor', 'trivial']
      },
      {
        type: 'input',
        name: 'rootCause',
        message: 'Root cause (optional):'
      },
      {
        type: 'input',
        name: 'testId',
        message: 'Link to test ID (optional):'
      }
    ]);

    try {
      const testId = answers.testId ? answers.testId : undefined;
      const defect = await defectManager.createDefectFromTest(
        testId || 'manual-defect',
        answers.title,
        answers.description,
        answers.severity,
        answers.rootCause || undefined
      );

      Logger.success(`✓ Defect created: ${defect.id} (${chalk.cyan(defect.title)})`);
    } catch (error) {
      Logger.error(`Failed to create defect: ${(error as Error).message}`);
    }
  });

defectCmd
  .command('list')
  .option('--status <status>', 'Filter by status')
  .description('List all defects')
  .action(async (options) => {
    const defectManager = new DefectManager();

    try {
      let defects: Defect[] = [];

      if (options.status) {
        defects = defectManager.getDefectsByStatus(options.status);
      } else {
        defects = defectManager.getAllDefects();
      }

      if (defects.length === 0) {
        Logger.info('No defects found');
        return;
      }

      console.log('');
      console.log(chalk.bold('Defects:'));
      console.log(chalk.dim('─'.repeat(120)));

      defects.forEach((defect) => {
        const statusColor = defect.status === 'open' ? 'red' : defect.status === 'in-progress' ? 'yellow' : 'green';
        console.log(
          `${chalk.cyan(defect.id)} | ${chalk.bold(defect.title)} | ${chalk[statusColor](defect.status)} | ${chalk.dim(defect.severity)}`
        );
      });

      console.log(chalk.dim('─'.repeat(120)));
      Logger.info(`Total: ${defects.length} defects`);
    } catch (error) {
      Logger.error(`Failed to list defects: ${(error as Error).message}`);
    }
  });

defectCmd
  .command('status <defect-id> <new-status>')
  .description('Update defect status (open, in-progress, resolved, verified)')
  .action(async (defectId: string, newStatus: string) => {
    const defectManager = new DefectManager();

    try {
      await defectManager.updateStatus(defectId, newStatus as Defect['status']);
      Logger.success(`✓ Defect ${defectId} status updated to ${newStatus}`);
    } catch (error) {
      Logger.error(`Failed to update defect status: ${(error as Error).message}`);
    }
  });

defectCmd
  .command('resolve <defect-id>')
  .description('Mark defect as resolved with root cause')
  .action(async (defectId: string) => {
    const defectManager = new DefectManager();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'rootCause',
        message: 'Root cause:',
        validate: (v) => v.length > 0 || 'Root cause is required'
      },
      {
        type: 'input',
        name: 'resolution',
        message: 'Resolution:',
        validate: (v) => v.length > 0 || 'Resolution is required'
      },
      {
        type: 'input',
        name: 'pullRequest',
        message: 'Pull request URL (optional):'
      }
    ]);

    try {
      await defectManager.setResolution(
        defectId,
        answers.rootCause,
        answers.resolution,
        answers.pullRequest || undefined
      );

      if (answers.pullRequest) {
        await defectManager.linkPullRequest(defectId, answers.pullRequest);
      }

      Logger.success(`✓ Defect ${defectId} resolved`);
    } catch (error) {
      Logger.error(`Failed to resolve defect: ${(error as Error).message}`);
    }
  });

defectCmd
  .command('health')
  .description('Show system defect health score')
  .action(async () => {
    const defectManager = new DefectManager();

    try {
      const healthScore = defectManager.getHealthScore();
      const critical = defectManager.getCriticalDefects();
      const unverified = defectManager.getUnverifiedDefects();

      console.log('');
      console.log(chalk.bold('Defect Health Report'));
      console.log(chalk.dim('─'.repeat(60)));

      const healthColor = healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red';
      console.log(`Health Score: ${chalk[healthColor](healthScore)}/100`);
      console.log(`Critical Defects: ${chalk.red(critical.length)}`);
      console.log(`Unverified Fixes: ${chalk.yellow(unverified.length)}`);

      if (critical.length > 0) {
        console.log('');
        console.log(chalk.bold.red('Critical Defects:'));
        critical.slice(0, 5).forEach((d) => {
          console.log(`  • ${d.title} (${d.id})`);
        });
      }

      console.log(chalk.dim('─'.repeat(60)));
    } catch (error) {
      Logger.error(`Failed to get health score: ${(error as Error).message}`);
    }
  });

const agileCmd = program
  .command('agile')
  .description('Agile board management');

agileCmd
  .command('board <action>')
  .description('Manage agile boards (create, list, show)')
  .action((action: string) => {
    Logger.info(`Agile board ${action} - See documentation for details`);
  });

// Help
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('Examples:'));
  console.log('  $ testmgr init');
  console.log('  $ testmgr story create');
  console.log('  $ testmgr test link');
  console.log('  $ testmgr link-code');
  console.log('  $ testmgr issue create');
  console.log('  $ testmgr issue list');
  console.log('  $ testmgr defect list');
  console.log('  $ testmgr defect health');
  console.log('  $ testmgr dashboard');
  console.log('  $ testmgr matrix');
  console.log('');
  console.log(chalk.dim('For more information, visit: https://github.com/your-repo'));
});

program.parse();
