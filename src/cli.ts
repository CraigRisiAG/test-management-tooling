#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { UIModule } from './modules/ui';
import { ConfigModule } from './modules/config';
import { LifecycleModule } from './modules/lifecycle';
import { GitOpsModule } from './modules/gitops';
import { RepositoryViewerModule } from './modules/repository-viewer';
import { Logger } from './utils/logger';

/**
 * Zebrunner CLI - Main Entry Point
 * Converted from zebrunner.sh
 */

const program = new Command();

program
  .name('zebrunner')
  .description('Zebrunner Test Management Platform CLI')
  .version('2.6.0')
  .option('--debug', 'Enable debug logging')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
      Logger.enableDebug();
    }
  });

// Setup command
program
  .command('setup')
  .description('Setup Zebrunner platform and configure services')
  .action(async () => {
    try {
      UIModule.printBanner();
      Logger.info('Starting Zebrunner setup...');
      
      // Configuration will be implemented in setup module
      Logger.warn('Setup functionality coming soon');
      
    } catch (error) {
      Logger.error(`Setup failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Start command
program
  .command('start')
  .description('Start all Zebrunner services')
  .action(async () => {
    try {
      await LifecycleModule.start();
    } catch (error) {
      Logger.error(`Start failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop all services (containers remain)')
  .action(async () => {
    try {
      await LifecycleModule.stop();
    } catch (error) {
      Logger.error(`Stop failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Restart command
program
  .command('restart')
  .description('Restart all services')
  .action(async () => {
    try {
      await LifecycleModule.restart();
    } catch (error) {
      Logger.error(`Restart failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Down command
program
  .command('down')
  .description('Stop and remove all containers')
  .action(async () => {
    try {
      await LifecycleModule.down();
    } catch (error) {
      Logger.error(`Down failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Shutdown command
program
  .command('shutdown')
  .description('Shutdown platform and remove volumes')
  .action(async () => {
    try {
      await LifecycleModule.shutdown();
    } catch (error) {
      Logger.error(`Shutdown failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Version command
program
  .command('version')
  .description('Display service versions')
  .action(() => {
    try {
      LifecycleModule.version();
    } catch (error) {
      Logger.error(`Version check failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Enable command
program
  .command('enable <service>')
  .description('Enable a service layer')
  .action(async (service: string) => {
    try {
      await ConfigModule.enableLayer(service);
    } catch (error) {
      Logger.error(`Enable failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Disable command
program
  .command('disable <service>')
  .description('Disable a service layer')
  .action(async (service: string) => {
    try {
      await ConfigModule.disableLayer(service);
    } catch (error) {
      Logger.error(`Disable failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Help command (override default)
program
  .command('help')
  .description('Display help information')
  .action(() => {
    UIModule.showHelp();
  });

// Repository commands
const repo = program.command('repo').description('Git repository management');

repo
  .command('init [path]')
  .description('Initialize a Git repository')
  .option('-u, --url <url>', 'Remote repository URL')
  .action(async (repoPath: string = process.cwd(), options: { url?: string }) => {
    try {
      const repository = await GitOpsModule.initRepository(repoPath, options.url);
      Logger.success(`Repository initialized: ${repository.name}`);
    } catch (error) {
      Logger.error(`Init failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('clone <url> [path]')
  .description('Clone a repository')
  .option('-b, --branch <branch>', 'Branch to clone')
  .action(async (url: string, targetPath: string = '.', options: { branch?: string }) => {
    try {
      const repository = await GitOpsModule.cloneRepository(url, targetPath, options.branch);
      Logger.success(`Repository cloned: ${repository.name}`);
    } catch (error) {
      Logger.error(`Clone failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('status [path]')
  .description('Show repository status')
  .action((repoPath: string = process.cwd()) => {
    try {
      const status = GitOpsModule.getStatus(repoPath);
      Logger.section('Repository Status');
      Logger.info(`Branch: ${status.branch}`);
      Logger.info(`Ahead: ${status.ahead} | Behind: ${status.behind}`);
      Logger.info(`Modified: ${status.modified} | Added: ${status.added} | Deleted: ${status.deleted}`);
      Logger.info(`Untracked: ${status.untracked}`);
      Logger.info(`Clean: ${status.clean ? 'Yes' : 'No'}`);
    } catch (error) {
      Logger.error(`Status check failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('log [path]')
  .description('Show commit history')
  .option('-n, --limit <number>', 'Number of commits to show', '20')
  .action((repoPath: string = process.cwd(), options: { limit: string }) => {
    try {
      const commits = GitOpsModule.getCommitHistory(repoPath, parseInt(options.limit));
      Logger.section(`Commit History (${commits.length} commits)`);
      
      commits.forEach((commit) => {
        console.log(chalk.yellow(commit.hash.substring(0, 8)) + ' ' + chalk.white(commit.message));
        console.log(chalk.gray(`  ${commit.author} <${commit.email}> - ${commit.date.toLocaleString()}`));
        if (commit.files.length > 0) {
          console.log(chalk.gray(`  Files: ${commit.files.length}`));
        }
        console.log('');
      });
    } catch (error) {
      Logger.error(`Log failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('branches [path]')
  .description('List branches')
  .action((repoPath: string = process.cwd()) => {
    try {
      const branches = GitOpsModule.getBranches(repoPath);
      Logger.section('Branches');
      
      branches.forEach((branch) => {
        const prefix = branch.current ? '* ' : '  ';
        const color = branch.current ? chalk.green : chalk.white;
        const remote = branch.remote ? chalk.gray(' (remote)') : '';
        console.log(prefix + color(branch.name) + remote);
      });
    } catch (error) {
      Logger.error(`Branch list failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('sync [path]')
  .description('Sync repository (pull + push)')
  .action(async (repoPath: string = process.cwd()) => {
    try {
      const syncOp = await GitOpsModule.sync(repoPath);
      
      if (syncOp.status === 'success') {
        Logger.success(`Sync completed with ${syncOp.changes} changes`);
      } else {
        Logger.error('Sync failed');
        syncOp.errors?.forEach((err) => Logger.error(err));
      }
    } catch (error) {
      Logger.error(`Sync failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('browse [path]')
  .description('Browse repository files')
  .option('-d, --depth <number>', 'Tree depth', '3')
  .action((repoPath: string = process.cwd(), options: { depth: string }) => {
    try {
      const tree = RepositoryViewerModule.buildFileTree(repoPath, parseInt(options.depth));
      Logger.section(`Repository: ${tree.name}`);
      RepositoryViewerModule.displayFileTree(tree);
    } catch (error) {
      Logger.error(`Browse failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('diff [path]')
  .description('Show diff')
  .option('-c, --commit <commit>', 'Compare with commit', 'HEAD~1')
  .action((repoPath: string = process.cwd(), options: { commit: string }) => {
    try {
      const diffs = RepositoryViewerModule.getDiff(repoPath, options.commit, 'HEAD');
      
      if (diffs.length === 0) {
        Logger.info('No changes');
        return;
      }

      Logger.section('Changes');
      RepositoryViewerModule.displayDiff(diffs);
    } catch (error) {
      Logger.error(`Diff failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('search <term> [path]')
  .description('Search in repository')
  .option('-f, --files', 'Search file names only')
  .action((term: string, repoPath: string = process.cwd(), options: { files?: boolean }) => {
    try {
      if (options.files) {
        const files = RepositoryViewerModule.searchFiles(repoPath, term);
        Logger.section(`Files matching "${term}"`);
        files.forEach((file) => console.log(chalk.white(file)));
      } else {
        const results = RepositoryViewerModule.searchContent(repoPath, term);
        Logger.section(`Content matching "${term}"`);
        results.forEach((result) => {
          console.log(chalk.blue(result.file) + ':' + chalk.yellow(result.line));
          console.log(chalk.gray('  ' + result.content));
        });
      }
    } catch (error) {
      Logger.error(`Search failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

repo
  .command('summary [path]')
  .description('Show repository summary')
  .action((repoPath: string = process.cwd()) => {
    try {
      const summary = RepositoryViewerModule.getSummary(repoPath);
      Logger.section('Repository Summary');
      Logger.info(`Total files: ${summary.totalFiles}`);
      Logger.info(`Total commits: ${summary.totalCommits}`);
      Logger.info(`Total authors: ${summary.totalAuthors}`);
      
      console.log('\n' + chalk.bold('Languages:'));
      Object.entries(summary.languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([lang, count]) => {
          console.log(`  ${chalk.cyan(lang)}: ${count} files`);
        });
    } catch (error) {
      Logger.error(`Summary failed: ${(error as Error).message}`);
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
  .action(async (projectPath: string = process.cwd(), options: { url?: string; branch: string }) => {
    try {
      const repository = await GitOpsModule.initRepository(projectPath, options.url);
      repository.branch = options.branch;
      await GitOpsModule.enableGitOps(projectPath, repository);
      Logger.success('GitOps enabled for project');
    } catch (error) {
      Logger.error(`GitOps enable failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

gitops
  .command('disable [path]')
  .description('Disable GitOps for project')
  .action(async (projectPath: string = process.cwd()) => {
    try {
      await GitOpsModule.disableGitOps(projectPath);
    } catch (error) {
      Logger.error(`GitOps disable failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

gitops
  .command('config [path]')
  .description('Show GitOps configuration')
  .action((projectPath: string = process.cwd()) => {
    try {
      const config = GitOpsModule.loadConfig(projectPath);
      
      if (!config) {
        Logger.warn('GitOps not configured for this project');
        return;
      }

      Logger.section('GitOps Configuration');
      Logger.info(`Enabled: ${config.enabled}`);
      Logger.info(`Auto-sync: ${config.autoSync || false}`);
      Logger.info(`Sync interval: ${config.syncInterval || 'manual'} minutes`);
      
      console.log('\n' + chalk.bold('Repositories:'));
      config.repositories.forEach((repo) => {
        console.log(`  ${chalk.cyan(repo.name)}: ${repo.url} (${repo.branch})`);
      });
    } catch (error) {
      Logger.error(`Config display failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Default action - show help if no command
program.action(() => {
  UIModule.printBanner();
  UIModule.showHelp();
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  UIModule.printBanner();
  UIModule.showHelp();
}
