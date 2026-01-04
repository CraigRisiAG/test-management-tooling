#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ui_1 = require("./modules/ui");
const config_1 = require("./modules/config");
const lifecycle_1 = require("./modules/lifecycle");
const gitops_1 = require("./modules/gitops");
const repository_viewer_1 = require("./modules/repository-viewer");
const agile_1 = require("./modules/agile");
const logger_1 = require("./utils/logger");
/**
 * Zebrunner CLI - Main Entry Point
 * Converted from zebrunner.sh
 */
const program = new commander_1.Command();
program
    .name('zebrunner')
    .description('Zebrunner Test Management Platform CLI')
    .version('2.6.0')
    .option('--debug', 'Enable debug logging')
    .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
        logger_1.Logger.enableDebug();
    }
});
// Setup command
program
    .command('setup')
    .description('Setup Zebrunner platform and configure services')
    .action(async () => {
    try {
        ui_1.UIModule.printBanner();
        logger_1.Logger.info('Starting Zebrunner setup...');
        // Configuration will be implemented in setup module
        logger_1.Logger.warn('Setup functionality coming soon');
    }
    catch (error) {
        logger_1.Logger.error(`Setup failed: ${error.message}`);
        process.exit(1);
    }
});
// Start command
program
    .command('start')
    .description('Start all Zebrunner services')
    .action(async () => {
    try {
        await lifecycle_1.LifecycleModule.start();
    }
    catch (error) {
        logger_1.Logger.error(`Start failed: ${error.message}`);
        process.exit(1);
    }
});
// Stop command
program
    .command('stop')
    .description('Stop all services (containers remain)')
    .action(async () => {
    try {
        await lifecycle_1.LifecycleModule.stop();
    }
    catch (error) {
        logger_1.Logger.error(`Stop failed: ${error.message}`);
        process.exit(1);
    }
});
// Restart command
program
    .command('restart')
    .description('Restart all services')
    .action(async () => {
    try {
        await lifecycle_1.LifecycleModule.restart();
    }
    catch (error) {
        logger_1.Logger.error(`Restart failed: ${error.message}`);
        process.exit(1);
    }
});
// Down command
program
    .command('down')
    .description('Stop and remove all containers')
    .action(async () => {
    try {
        await lifecycle_1.LifecycleModule.down();
    }
    catch (error) {
        logger_1.Logger.error(`Down failed: ${error.message}`);
        process.exit(1);
    }
});
// Shutdown command
program
    .command('shutdown')
    .description('Shutdown platform and remove volumes')
    .action(async () => {
    try {
        await lifecycle_1.LifecycleModule.shutdown();
    }
    catch (error) {
        logger_1.Logger.error(`Shutdown failed: ${error.message}`);
        process.exit(1);
    }
});
// Version command
program
    .command('version')
    .description('Display service versions')
    .action(() => {
    try {
        lifecycle_1.LifecycleModule.version();
    }
    catch (error) {
        logger_1.Logger.error(`Version check failed: ${error.message}`);
        process.exit(1);
    }
});
// Enable command
program
    .command('enable <service>')
    .description('Enable a service layer')
    .action(async (service) => {
    try {
        await config_1.ConfigModule.enableLayer(service);
    }
    catch (error) {
        logger_1.Logger.error(`Enable failed: ${error.message}`);
        process.exit(1);
    }
});
// Disable command
program
    .command('disable <service>')
    .description('Disable a service layer')
    .action(async (service) => {
    try {
        await config_1.ConfigModule.disableLayer(service);
    }
    catch (error) {
        logger_1.Logger.error(`Disable failed: ${error.message}`);
        process.exit(1);
    }
});
// Help command (override default)
program
    .command('help')
    .description('Display help information')
    .action(() => {
    ui_1.UIModule.showHelp();
});
// Repository commands
const repo = program.command('repo').description('Git repository management');
repo
    .command('init [path]')
    .description('Initialize a Git repository')
    .option('-u, --url <url>', 'Remote repository URL')
    .action(async (repoPath = process.cwd(), options) => {
    try {
        const repository = await gitops_1.GitOpsModule.initRepository(repoPath, options.url);
        logger_1.Logger.success(`Repository initialized: ${repository.name}`);
    }
    catch (error) {
        logger_1.Logger.error(`Init failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('clone <url> [path]')
    .description('Clone a repository')
    .option('-b, --branch <branch>', 'Branch to clone')
    .action(async (url, targetPath = '.', options) => {
    try {
        const repository = await gitops_1.GitOpsModule.cloneRepository(url, targetPath, options.branch);
        logger_1.Logger.success(`Repository cloned: ${repository.name}`);
    }
    catch (error) {
        logger_1.Logger.error(`Clone failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('status [path]')
    .description('Show repository status')
    .action((repoPath = process.cwd()) => {
    try {
        const status = gitops_1.GitOpsModule.getStatus(repoPath);
        logger_1.Logger.section('Repository Status');
        logger_1.Logger.info(`Branch: ${status.branch}`);
        logger_1.Logger.info(`Ahead: ${status.ahead} | Behind: ${status.behind}`);
        logger_1.Logger.info(`Modified: ${status.modified} | Added: ${status.added} | Deleted: ${status.deleted}`);
        logger_1.Logger.info(`Untracked: ${status.untracked}`);
        logger_1.Logger.info(`Clean: ${status.clean ? 'Yes' : 'No'}`);
    }
    catch (error) {
        logger_1.Logger.error(`Status check failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('log [path]')
    .description('Show commit history')
    .option('-n, --limit <number>', 'Number of commits to show', '20')
    .action((repoPath = process.cwd(), options) => {
    try {
        const commits = gitops_1.GitOpsModule.getCommitHistory(repoPath, parseInt(options.limit));
        logger_1.Logger.section(`Commit History (${commits.length} commits)`);
        commits.forEach((commit) => {
            console.log(chalk_1.default.yellow(commit.hash.substring(0, 8)) + ' ' + chalk_1.default.white(commit.message));
            console.log(chalk_1.default.gray(`  ${commit.author} <${commit.email}> - ${commit.date.toLocaleString()}`));
            if (commit.files.length > 0) {
                console.log(chalk_1.default.gray(`  Files: ${commit.files.length}`));
            }
            console.log('');
        });
    }
    catch (error) {
        logger_1.Logger.error(`Log failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('branches [path]')
    .description('List branches')
    .action((repoPath = process.cwd()) => {
    try {
        const branches = gitops_1.GitOpsModule.getBranches(repoPath);
        logger_1.Logger.section('Branches');
        branches.forEach((branch) => {
            const prefix = branch.current ? '* ' : '  ';
            const color = branch.current ? chalk_1.default.green : chalk_1.default.white;
            const remote = branch.remote ? chalk_1.default.gray(' (remote)') : '';
            console.log(prefix + color(branch.name) + remote);
        });
    }
    catch (error) {
        logger_1.Logger.error(`Branch list failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('sync [path]')
    .description('Sync repository (pull + push)')
    .action(async (repoPath = process.cwd()) => {
    try {
        const syncOp = await gitops_1.GitOpsModule.sync(repoPath);
        if (syncOp.status === 'success') {
            logger_1.Logger.success(`Sync completed with ${syncOp.changes} changes`);
        }
        else {
            logger_1.Logger.error('Sync failed');
            syncOp.errors?.forEach((err) => logger_1.Logger.error(err));
        }
    }
    catch (error) {
        logger_1.Logger.error(`Sync failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('browse [path]')
    .description('Browse repository files')
    .option('-d, --depth <number>', 'Tree depth', '3')
    .action((repoPath = process.cwd(), options) => {
    try {
        const tree = repository_viewer_1.RepositoryViewerModule.buildFileTree(repoPath, parseInt(options.depth));
        logger_1.Logger.section(`Repository: ${tree.name}`);
        repository_viewer_1.RepositoryViewerModule.displayFileTree(tree);
    }
    catch (error) {
        logger_1.Logger.error(`Browse failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('diff [path]')
    .description('Show diff')
    .option('-c, --commit <commit>', 'Compare with commit', 'HEAD~1')
    .action((repoPath = process.cwd(), options) => {
    try {
        const diffs = repository_viewer_1.RepositoryViewerModule.getDiff(repoPath, options.commit, 'HEAD');
        if (diffs.length === 0) {
            logger_1.Logger.info('No changes');
            return;
        }
        logger_1.Logger.section('Changes');
        repository_viewer_1.RepositoryViewerModule.displayDiff(diffs);
    }
    catch (error) {
        logger_1.Logger.error(`Diff failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('search <term> [path]')
    .description('Search in repository')
    .option('-f, --files', 'Search file names only')
    .action((term, repoPath = process.cwd(), options) => {
    try {
        if (options.files) {
            const files = repository_viewer_1.RepositoryViewerModule.searchFiles(repoPath, term);
            logger_1.Logger.section(`Files matching "${term}"`);
            files.forEach((file) => console.log(chalk_1.default.white(file)));
        }
        else {
            const results = repository_viewer_1.RepositoryViewerModule.searchContent(repoPath, term);
            logger_1.Logger.section(`Content matching "${term}"`);
            results.forEach((result) => {
                console.log(chalk_1.default.blue(result.file) + ':' + chalk_1.default.yellow(result.line));
                console.log(chalk_1.default.gray('  ' + result.content));
            });
        }
    }
    catch (error) {
        logger_1.Logger.error(`Search failed: ${error.message}`);
        process.exit(1);
    }
});
repo
    .command('summary [path]')
    .description('Show repository summary')
    .action((repoPath = process.cwd()) => {
    try {
        const summary = repository_viewer_1.RepositoryViewerModule.getSummary(repoPath);
        logger_1.Logger.section('Repository Summary');
        logger_1.Logger.info(`Total files: ${summary.totalFiles}`);
        logger_1.Logger.info(`Total commits: ${summary.totalCommits}`);
        logger_1.Logger.info(`Total authors: ${summary.totalAuthors}`);
        console.log('\n' + chalk_1.default.bold('Languages:'));
        Object.entries(summary.languages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .forEach(([lang, count]) => {
            console.log(`  ${chalk_1.default.cyan(lang)}: ${count} files`);
        });
    }
    catch (error) {
        logger_1.Logger.error(`Summary failed: ${error.message}`);
        process.exit(1);
    }
});
// GitOps commands
const gitops = program.command('gitops').description('GitOps configuration management');
gitops
    .command('enable [path]')
    .description('Enable GitOps for project')
    .option('-u, --url <url>', 'Repository URL')
    .option('-b, --branch <branch>', 'Branch name', 'main')
    .action(async (projectPath = process.cwd(), options) => {
    try {
        const repository = await gitops_1.GitOpsModule.initRepository(projectPath, options.url);
        repository.branch = options.branch;
        await gitops_1.GitOpsModule.enableGitOps(projectPath, repository);
        logger_1.Logger.success('GitOps enabled for project');
    }
    catch (error) {
        logger_1.Logger.error(`GitOps enable failed: ${error.message}`);
        process.exit(1);
    }
});
gitops
    .command('disable [path]')
    .description('Disable GitOps for project')
    .action(async (projectPath = process.cwd()) => {
    try {
        await gitops_1.GitOpsModule.disableGitOps(projectPath);
    }
    catch (error) {
        logger_1.Logger.error(`GitOps disable failed: ${error.message}`);
        process.exit(1);
    }
});
gitops
    .command('config [path]')
    .description('Show GitOps configuration')
    .action((projectPath = process.cwd()) => {
    try {
        const config = gitops_1.GitOpsModule.loadConfig(projectPath);
        if (!config) {
            logger_1.Logger.warn('GitOps not configured for this project');
            return;
        }
        logger_1.Logger.section('GitOps Configuration');
        logger_1.Logger.info(`Enabled: ${config.enabled}`);
        logger_1.Logger.info(`Auto-sync: ${config.autoSync || false}`);
        logger_1.Logger.info(`Sync interval: ${config.syncInterval || 'manual'} minutes`);
        console.log('\n' + chalk_1.default.bold('Repositories:'));
        config.repositories.forEach((repo) => {
            console.log(`  ${chalk_1.default.cyan(repo.name)}: ${repo.url} (${repo.branch})`);
        });
    }
    catch (error) {
        logger_1.Logger.error(`Config display failed: ${error.message}`);
        process.exit(1);
    }
});
// ==================== Agile Board Commands ====================
const agile = program.command('agile').description('Agile board management');
// Initialize agile configuration
agile
    .command('init')
    .description('Initialize agile board configuration')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (options) => {
    try {
        await agile_1.AgileModule.init(options.path);
    }
    catch (error) {
        logger_1.Logger.error(`Agile init failed: ${error.message}`);
        process.exit(1);
    }
});
// Board commands
const board = agile.command('board').description('Manage agile boards');
board
    .command('create <name>')
    .description('Create a new agile board')
    .option('-d, --description <desc>', 'Board description')
    .option('-s, --sprint-duration <weeks>', 'Sprint duration in weeks', '2')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (name, options) => {
    try {
        await agile_1.AgileModule.createBoard(name, {
            description: options.description,
            sprintDurationWeeks: parseInt(options.sprintDuration),
            projectPath: options.path,
        });
    }
    catch (error) {
        logger_1.Logger.error(`Board creation failed: ${error.message}`);
        process.exit(1);
    }
});
board
    .command('list')
    .description('List all agile boards')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (options) => {
    try {
        const boards = await agile_1.AgileModule.getBoards(undefined, options.path);
        if (boards.length === 0) {
            logger_1.Logger.warn('No boards found. Create one with: zebrunner agile board create <name>');
            return;
        }
        console.log('\n' + chalk_1.default.bold('📊 Agile Boards:'));
        boards.forEach((board) => {
            console.log(`\n  ${chalk_1.default.cyan(board.name)} (ID: ${board.id})`);
            console.log(`    Status: ${board.status}`);
            console.log(`    Sprints: ${board.sprints.length}`);
            console.log(`    Backlog: ${board.backlog.length} stories`);
            if (board.description) {
                console.log(`    ${board.description}`);
            }
        });
    }
    catch (error) {
        logger_1.Logger.error(`Board list failed: ${error.message}`);
        process.exit(1);
    }
});
board
    .command('show <boardId>')
    .description('Show detailed board information')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (boardId, options) => {
    try {
        await agile_1.AgileModule.displayBoardSummary(boardId, options.path);
    }
    catch (error) {
        logger_1.Logger.error(`Board display failed: ${error.message}`);
        process.exit(1);
    }
});
// Sprint commands
const sprint = agile.command('sprint').description('Manage sprints');
sprint
    .command('create <boardId> <name>')
    .description('Create a new sprint')
    .option('-g, --goal <goal>', 'Sprint goal')
    .option('-s, --start <date>', 'Start date (YYYY-MM-DD)')
    .option('-e, --end <date>', 'End date (YYYY-MM-DD)')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (boardId, name, options) => {
    try {
        const startDate = options.start ? new Date(options.start) : undefined;
        const endDate = options.end ? new Date(options.end) : undefined;
        await agile_1.AgileModule.createSprint(boardId, name, {
            goal: options.goal,
            startDate,
            endDate,
            projectPath: options.path,
        });
    }
    catch (error) {
        logger_1.Logger.error(`Sprint creation failed: ${error.message}`);
        process.exit(1);
    }
});
sprint
    .command('start <sprintId>')
    .description('Start a sprint')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (sprintId, options) => {
    try {
        await agile_1.AgileModule.startSprint(sprintId, options.path);
    }
    catch (error) {
        logger_1.Logger.error(`Sprint start failed: ${error.message}`);
        process.exit(1);
    }
});
sprint
    .command('complete <sprintId>')
    .description('Complete a sprint')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (sprintId, options) => {
    try {
        const metrics = await agile_1.AgileModule.completeSprint(sprintId, options.path);
        logger_1.Logger.info(`\n📈 Sprint Metrics:`);
        logger_1.Logger.info(`  Completed Stories: ${metrics.completedStories}/${metrics.totalStories}`);
        logger_1.Logger.info(`  Completed Points: ${metrics.completedPoints}/${metrics.totalPoints}`);
        logger_1.Logger.info(`  Velocity: ${metrics.velocity} points`);
        logger_1.Logger.info(`  Test Coverage: ${metrics.testCoverage.toFixed(1)}%`);
    }
    catch (error) {
        logger_1.Logger.error(`Sprint completion failed: ${error.message}`);
        process.exit(1);
    }
});
sprint
    .command('show <sprintId>')
    .description('Show sprint details')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (sprintId, options) => {
    try {
        await agile_1.AgileModule.displaySprintSummary(sprintId, options.path);
    }
    catch (error) {
        logger_1.Logger.error(`Sprint display failed: ${error.message}`);
        process.exit(1);
    }
});
// Story commands
const story = agile.command('story').description('Manage user stories');
story
    .command('create <boardId> <title>')
    .description('Create a new user story')
    .option('-d, --description <desc>', 'Story description')
    .option('-t, --type <type>', 'Story type (feature|bug|chore|spike)', 'feature')
    .option('--priority <priority>', 'Priority (low|medium|high|critical)', 'medium')
    .option('-e, --estimate <points>', 'Story point estimate')
    .option('-a, --assignee <name>', 'Assignee name')
    .option('-s, --sprint <sprintId>', 'Sprint ID (if not in backlog)')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (boardId, title, options) => {
    try {
        await agile_1.AgileModule.createStory(boardId, title, {
            description: options.description,
            type: options.type,
            priority: options.priority,
            estimate: options.estimate ? parseInt(options.estimate) : undefined,
            assignee: options.assignee,
            sprintId: options.sprint,
            tags: options.tags ? options.tags.split(',') : undefined,
            projectPath: options.path,
        });
    }
    catch (error) {
        logger_1.Logger.error(`Story creation failed: ${error.message}`);
        process.exit(1);
    }
});
story
    .command('status <storyId> <status>')
    .description('Update story status')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (storyId, status, options) => {
    try {
        await agile_1.AgileModule.updateStoryStatus(storyId, status, options.path);
    }
    catch (error) {
        logger_1.Logger.error(`Status update failed: ${error.message}`);
        process.exit(1);
    }
});
story
    .command('move <storyId> <sprintId>')
    .description('Move story to sprint')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (storyId, sprintId, options) => {
    try {
        await agile_1.AgileModule.moveStoryToSprint(storyId, sprintId, options.path);
    }
    catch (error) {
        logger_1.Logger.error(`Story move failed: ${error.message}`);
        process.exit(1);
    }
});
story
    .command('link-test <storyId> <testPath>')
    .description('Link a test to a story')
    .option('-n, --name <name>', 'Test name')
    .option('-t, --type <type>', 'Test type (unit|integration|e2e|performance)', 'unit')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (storyId, testPath, options) => {
    try {
        await agile_1.AgileModule.linkTest(storyId, testPath, {
            testName: options.name,
            testType: options.type,
            projectPath: options.path,
        });
    }
    catch (error) {
        logger_1.Logger.error(`Test linking failed: ${error.message}`);
        process.exit(1);
    }
});
story
    .command('link-repo <storyId> <repoUrl>')
    .description('Link repository to a story')
    .option('-b, --branch <branch>', 'Branch name')
    .option('-c, --commits <commits>', 'Comma-separated commit hashes')
    .option('--auto-detect', 'Auto-detect commits mentioning story')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (storyId, repoUrl, options) => {
    try {
        await agile_1.AgileModule.linkRepository(storyId, repoUrl, {
            branch: options.branch,
            commits: options.commits ? options.commits.split(',') : undefined,
            autoDetect: options.autoDetect,
            projectPath: options.path,
        });
    }
    catch (error) {
        logger_1.Logger.error(`Repository linking failed: ${error.message}`);
        process.exit(1);
    }
});
// Metrics commands
agile
    .command('metrics <boardId>')
    .description('Show board metrics and analytics')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (boardId, options) => {
    try {
        const metrics = await agile_1.AgileModule.getBoardMetrics(boardId, options.path);
        console.log('\n' + chalk_1.default.bold('📊 Board Metrics:'));
        console.log(`\n  Total Stories: ${metrics.totalStories}`);
        console.log('\n  Stories by Status:');
        Object.entries(metrics.storiesByStatus).forEach(([status, count]) => {
            if (count > 0) {
                console.log(`    ${status}: ${count}`);
            }
        });
        console.log('\n  Stories by Priority:');
        Object.entries(metrics.storiesByPriority).forEach(([priority, count]) => {
            if (count > 0) {
                console.log(`    ${priority}: ${count}`);
            }
        });
        console.log(`\n  Average Velocity: ${metrics.averageVelocity.toFixed(1)} points/sprint`);
        console.log(`  Average Cycle Time: ${metrics.averageCycleTime.toFixed(1)} days`);
        console.log(`  Test Coverage: ${metrics.testCoveragePercentage.toFixed(1)}%`);
        console.log(`  Completed Sprints: ${metrics.completedSprints}`);
    }
    catch (error) {
        logger_1.Logger.error(`Metrics display failed: ${error.message}`);
        process.exit(1);
    }
});
// Default action - show help if no command
program.action(() => {
    ui_1.UIModule.printBanner();
    ui_1.UIModule.showHelp();
});
// Parse arguments
program.parse(process.argv);
// Show help if no arguments provided
if (!process.argv.slice(2).length) {
    ui_1.UIModule.printBanner();
    ui_1.UIModule.showHelp();
}
//# sourceMappingURL=cli.js.map