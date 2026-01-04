#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import readline from 'readline';
import { TestRegistry } from './modules/test-registry';
import { TestExecutor } from './modules/test-executor';
import { CodeTracer } from './modules/code-tracer';
import { DashboardReporter } from './modules/dashboard-reporter';
import { IssueManager } from './modules/issue-manager';
import { DefectManager } from './modules/defect-manager';
import { UserManager } from './modules/user-manager';
import { GitOpsModule } from './modules/gitops';
import { AgileModule } from './modules/agile';
import { Logger } from './utils/logger';
import type { ModuleName } from './types';
import type { UserStory, TestCase, CodeReference, Issue, Defect, ModuleName } from './types';

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

// User Administration Commands
const userCmd = program
  .command('user')
  .description('User administration and access control');

userCmd
  .command('create')
  .description('Create a new user with module role assignments')
  .action(async () => {
    const userManager = UserManager.getInstance();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise(resolve => rl.question(prompt, resolve));
    };

    try {
      const email = await question(chalk.cyan('Email: '));
      const name = await question(chalk.cyan('Full Name: '));
      const isAdmin = await question(chalk.cyan('System Admin? (yes/no): '));
      
      const newUser = userManager.createUser(email, name, isAdmin.toLowerCase() === 'yes');
      
      console.log(chalk.green('\n✓ User created successfully'));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(`ID: ${newUser.id}`);
      console.log(`Email: ${newUser.email}`);
      console.log(`Name: ${newUser.name}`);
      console.log(`Status: ${newUser.status}`);
      console.log(`System Role: ${newUser.systemRole}`);
      console.log(chalk.dim('─'.repeat(60)));
      
      Logger.info(`User created: ${email}`);
    } catch (error) {
      Logger.error(`Failed to create user: ${(error as Error).message}`);
    } finally {
      rl.close();
    }
  });

userCmd
  .command('list')
  .description('List all users with optional filtering')
  .option('--status <status>', 'Filter by status (active, inactive, suspended)')
  .option('--role <role>', 'Filter by system role (admin, user)')
  .action((options: { status?: string; role?: string }) => {
    try {
      const userManager = UserManager.getInstance();
      const users = userManager.getAllUsers();
      
      let filtered = users;
      if (options.status) {
        filtered = userManager.filterUsers({ status: options.status as any });
      }
      if (options.role) {
        filtered = userManager.filterUsers({ role: options.role as any });
      }

      console.log('\n' + chalk.bold('Users'));
      console.log(chalk.dim('─'.repeat(100)));
      
      if (filtered.length === 0) {
        console.log(chalk.yellow('No users found'));
        return;
      }

      filtered.forEach((user) => {
        const statusColor = user.status === 'active' ? chalk.green : chalk.yellow;
        const roleColor = user.systemRole === 'admin' ? chalk.cyan : chalk.white;
        
        console.log(
          `${user.email.padEnd(30)} | ` +
          `${user.name.padEnd(25)} | ` +
          `${statusColor(user.status.padEnd(12))} | ` +
          `${roleColor(user.systemRole.padEnd(8))}`
        );
      });

      console.log(chalk.dim('─'.repeat(100)));
      console.log(chalk.dim(`Total: ${filtered.length} users`));
    } catch (error) {
      Logger.error(`Failed to list users: ${(error as Error).message}`);
    }
  });

userCmd
  .command('details <email>')
  .description('Show detailed user information and module permissions')
  .action((email: string) => {
    try {
      const userManager = UserManager.getInstance();
      const user = userManager.getUser(email);

      if (!user) {
        Logger.error(`User not found: ${email}`);
        return;
      }

      console.log('\n' + chalk.bold(`User Details: ${user.name}`));
      console.log(chalk.dim('─'.repeat(80)));
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Status: ${user.status}`);
      console.log(`System Role: ${user.systemRole}`);
      console.log(`Created: ${new Date(user.createdAt).toLocaleString()}`);
      
      console.log('\n' + chalk.bold('Module Permissions:'));
      console.log(chalk.dim('─'.repeat(80)));
      
      for (const [module, permission] of user.modulePermissions) {
        const role = permission.role;
        const roleColor = role === 'admin' ? chalk.cyan : role === 'user' ? chalk.green : chalk.blue;
        console.log(
          `${module.padEnd(25)} | Role: ${roleColor(role.padEnd(8))} | ` +
          `Read: ${permission.canRead ? '✓' : '✗'} | ` +
          `Write: ${permission.canWrite ? '✓' : '✗'} | ` +
          `Delete: ${permission.canDelete ? '✓' : '✗'} | ` +
          `Manage: ${permission.canManage ? '✓' : '✗'}`
        );
      }

      console.log(chalk.dim('─'.repeat(80)));
    } catch (error) {
      Logger.error(`Failed to get user details: ${(error as Error).message}`);
    }
  });

userCmd
  .command('role assign <email> <module> <role>')
  .description('Assign a role to user for specific module (read, user, admin)')
  .action((email: string, module: string, role: string) => {
    try {
      const userManager = UserManager.getInstance();
      const user = userManager.getUser(email);

      if (!user) {
        Logger.error(`User not found: ${email}`);
        return;
      }

      userManager.assignModuleRole(email, module as ModuleName, role as any);

      console.log(chalk.green(`\n✓ Role assigned successfully`));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(`User: ${email}`);
      console.log(`Module: ${module}`);
      console.log(`Role: ${role}`);
      console.log(chalk.dim('─'.repeat(60)));
      
      Logger.info(`Role assigned: ${email} -> ${module}: ${role}`);
    } catch (error) {
      Logger.error(`Failed to assign role: ${(error as Error).message}`);
    }
  });

userCmd
  .command('role list <email>')
  .description('List all module roles for a user')
  .action((email: string) => {
    try {
      const userManager = UserManager.getInstance();
      const user = userManager.getUser(email);

      if (!user) {
        Logger.error(`User not found: ${email}`);
        return;
      }

      console.log('\n' + chalk.bold(`Roles for ${user.name}`));
      console.log(chalk.dim('─'.repeat(60)));

      for (const [module, permission] of user.modulePermissions) {
        const roleColor = permission.role === 'admin' ? chalk.cyan : permission.role === 'user' ? chalk.green : chalk.blue;
        console.log(`${module.padEnd(30)} ${roleColor(permission.role)}`);
      }

      console.log(chalk.dim('─'.repeat(60)));
    } catch (error) {
      Logger.error(`Failed to list roles: ${(error as Error).message}`);
    }
  });

userCmd
  .command('status <email> <status>')
  .description('Update user status (active, inactive, suspended)')
  .action((email: string, status: string) => {
    try {
      const userManager = UserManager.getInstance();
      const user = userManager.getUser(email);

      if (!user) {
        Logger.error(`User not found: ${email}`);
        return;
      }

      userManager.updateStatus(email, status as any);

      const statusColor = status === 'active' ? chalk.green : chalk.yellow;
      console.log(chalk.green(`\n✓ User status updated`));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(`Email: ${email}`);
      console.log(`New Status: ${statusColor(status)}`);
      console.log(chalk.dim('─'.repeat(60)));
      
      Logger.info(`User status updated: ${email} -> ${status}`);
    } catch (error) {
      Logger.error(`Failed to update user status: ${(error as Error).message}`);
    }
  });

userCmd
  .command('login <email>')
  .description('Start user session (login)')
  .option('--ip <ip>', 'IP address')
  .option('--agent <agent>', 'User agent')
  .action((email: string, options: { ip?: string; agent?: string }) => {
    try {
      const userManager = UserManager.getInstance();
      const user = userManager.getUser(email);

      if (!user) {
        Logger.error(`User not found: ${email}`);
        return;
      }

      if (user.status !== 'active') {
        Logger.error(`Cannot login: User status is ${user.status}`);
        return;
      }

      const session = userManager.startSession(email, options.ip, options.agent);

      console.log(chalk.green(`\n✓ Session started`));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(`Session ID: ${session.id}`);
      console.log(`User: ${email}`);
      console.log(`Login Time: ${new Date(session.loginTime).toLocaleString()}`);
      console.log(`IP: ${session.ipAddress}`);
      console.log(chalk.dim('─'.repeat(60)));
      
      Logger.info(`User logged in: ${email}`);
    } catch (error) {
      Logger.error(`Failed to start session: ${(error as Error).message}`);
    }
  });

userCmd
  .command('logout <sessionId>')
  .description('End user session (logout)')
  .action((sessionId: string) => {
    try {
      const userManager = UserManager.getInstance();
      const session = userManager.endSession(sessionId);

      if (!session) {
        Logger.error(`Session not found: ${sessionId}`);
        return;
      }

      console.log(chalk.green(`\n✓ Session ended`));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(`Session ID: ${sessionId}`);
      console.log(`Duration: ${Math.round((session.logoutTime - session.loginTime) / 1000)} seconds`);
      console.log(chalk.dim('─'.repeat(60)));
      
      Logger.info(`User logged out: ${sessionId}`);
    } catch (error) {
      Logger.error(`Failed to end session: ${(error as Error).message}`);
    }
  });

userCmd
  .command('sessions [email]')
  .description('List active or historical sessions')
  .option('--all', 'Show all sessions including inactive')
  .action((email?: string, options?: { all?: boolean }) => {
    try {
      const userManager = UserManager.getInstance();
      const sessions = email ? userManager.getUserSessions(email) : userManager.getActiveSessions();

      console.log('\n' + chalk.bold('User Sessions'));
      console.log(chalk.dim('─'.repeat(120)));

      if (sessions.length === 0) {
        console.log(chalk.yellow('No sessions found'));
        return;
      }

      sessions.forEach((session) => {
        const status = session.logoutTime ? chalk.gray('inactive') : chalk.green('active');
        const duration = session.logoutTime 
          ? Math.round((session.logoutTime - session.loginTime) / 1000)
          : Math.round((Date.now() - session.loginTime) / 1000);
        
        console.log(
          `${session.id.substring(0, 12)}... | ` +
          `${session.userId.padEnd(20)} | ` +
          `${new Date(session.loginTime).toLocaleString().padEnd(20)} | ` +
          `${status} | ` +
          `${duration}s | ` +
          `${session.ipAddress}`
        );
      });

      console.log(chalk.dim('─'.repeat(120)));
      console.log(chalk.dim(`Total: ${sessions.length} sessions`));
    } catch (error) {
      Logger.error(`Failed to list sessions: ${(error as Error).message}`);
    }
  });

userCmd
  .command('audit')
  .description('View user audit log with optional filtering')
  .option('--user <email>', 'Filter by user email')
  .option('--module <module>', 'Filter by module')
  .option('--limit <number>', 'Number of entries to show', '50')
  .action((options: { user?: string; module?: string; limit: string }) => {
    try {
      const userManager = UserManager.getInstance();
      const limit = parseInt(options.limit);
      const log = userManager.getAuditLog({ userId: options.user, moduleName: options.module as ModuleName });

      console.log('\n' + chalk.bold('User Audit Log'));
      console.log(chalk.dim('─'.repeat(140)));

      const entries = log.slice(-limit);
      if (entries.length === 0) {
        console.log(chalk.yellow('No audit entries found'));
        return;
      }

      entries.forEach((entry) => {
        const actionColor = entry.action.includes('delete') ? chalk.red : entry.action.includes('create') ? chalk.green : chalk.blue;
        console.log(
          `${new Date(entry.timestamp).toLocaleString().padEnd(20)} | ` +
          `${entry.userId.padEnd(20)} | ` +
          `${entry.moduleName.padEnd(20)} | ` +
          `${actionColor(entry.action.padEnd(20))} | ` +
          `${(entry.details || 'N/A').substring(0, 40)}`
        );
      });

      console.log(chalk.dim('─'.repeat(140)));
      console.log(chalk.dim(`Showing ${entries.length} of ${log.length} entries`));
    } catch (error) {
      Logger.error(`Failed to get audit log: ${(error as Error).message}`);
    }
  });

userCmd
  .command('metrics')
  .description('Display user administration metrics and statistics')
  .action(() => {
    try {
      const userManager = UserManager.getInstance();
      const metrics = userManager.getMetrics();

      console.log('\n' + chalk.bold('User Administration Metrics'));
      console.log(chalk.dim('─'.repeat(80)));
      console.log(`Total Users: ${chalk.cyan(metrics.totalUsers.toString())}`);
      console.log(`Active Users: ${chalk.green(metrics.activeUsers.toString())}`);
      console.log(`Inactive Users: ${chalk.yellow(metrics.inactiveUsers.toString())}`);
      console.log(`Suspended Users: ${chalk.red(metrics.suspendedUsers.toString())}`);
      
      console.log('\n' + chalk.bold('By System Role:'));
      console.log(chalk.dim('─'.repeat(80)));
      console.log(`  Admins: ${metrics.bySystemRole.admin || 0}`);
      console.log(`  Users: ${metrics.bySystemRole.user || 0}`);

      console.log('\n' + chalk.bold('By Module and Role:'));
      console.log(chalk.dim('─'.repeat(80)));
      for (const [module, roles] of Object.entries(metrics.byModuleRole || {})) {
        console.log(`  ${module}:`);
        for (const [role, count] of Object.entries(roles || {})) {
          console.log(`    ${role}: ${count}`);
        }
      }

      console.log('\n' + chalk.bold('Session Statistics:'));
      console.log(chalk.dim('─'.repeat(80)));
      console.log(`  Active Sessions: ${metrics.activeSessions || 0}`);
      console.log(`  Total Sessions (historical): ${metrics.totalSessions || 0}`);

      console.log(chalk.dim('─'.repeat(80)));
    } catch (error) {
      Logger.error(`Failed to get metrics: ${(error as Error).message}`);
    }
  });

userCmd
  .command('delete <email>')
  .description('Delete a user account (mark as inactive)')
  .action(async (email: string) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirm = (prompt: string): Promise<string> => {
      return new Promise(resolve => rl.question(prompt, resolve));
    };

    try {
      const response = await confirm(chalk.yellow(`Are you sure you want to delete user ${email}? (yes/no): `));
      
      if (response.toLowerCase() !== 'yes') {
        console.log(chalk.dim('Cancelled'));
        return;
      }

      const userManager = UserManager.getInstance();
      userManager.deleteUser(email);

      console.log(chalk.green(`\n✓ User deleted successfully`));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(`Email: ${email}`);
      console.log(`Status: User account removed`);
      console.log(chalk.dim('─'.repeat(60)));
      
      Logger.info(`User deleted: ${email}`);
    } catch (error) {
      Logger.error(`Failed to delete user: ${(error as Error).message}`);
    } finally {
      rl.close();
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
  console.log('  $ testmgr user create');
  console.log('  $ testmgr user list');
  console.log('  $ testmgr user role assign');
  console.log('  $ testmgr dashboard');
  console.log('  $ testmgr matrix');
  console.log('');
  console.log(chalk.dim('For more information, visit: https://github.com/your-repo'));
});

program.parse();
