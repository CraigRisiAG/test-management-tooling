import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';
import { ShellExecutor } from '../utils/shell';
import {
  GitRepository,
  RepositoryStatus,
  GitCommit,
  GitBranch,
  GitOpsConfig,
  SyncOperation,
  CommitStats,
} from '../types';

/**
 * GitOps Module - Git repository management and GitOps operations
 */
export class GitOpsModule {
  private static readonly CONFIG_FILE = '.testmgr/gitops.json';

  /**
   * Initialize a Git repository
   */
  static async initRepository(repoPath: string, url?: string): Promise<GitRepository> {
    Logger.section('Initializing Git Repository');

    if (!fs.existsSync(repoPath)) {
      fs.mkdirSync(repoPath, { recursive: true });
    }

    // Check if already a git repository
    const isGitRepo = fs.existsSync(path.join(repoPath, '.git'));

    if (!isGitRepo) {
      const result = ShellExecutor.exec('git init', { cwd: repoPath });
      if (result.code !== 0) {
        throw new Error(`Failed to initialize repository: ${result.stderr}`);
      }
      Logger.success(`Repository initialized at ${repoPath}`);
    }

    // Add remote if URL provided
    if (url) {
      const remoteResult = ShellExecutor.exec(`git remote add origin ${url}`, { cwd: repoPath });
      if (remoteResult.code !== 0 && !remoteResult.stderr.includes('already exists')) {
        Logger.warn(`Could not add remote: ${remoteResult.stderr}`);
      }
    }

    const branch = this.getCurrentBranch(repoPath);

    return {
      name: path.basename(repoPath),
      url: url || '',
      branch,
      path: repoPath,
      remote: 'origin',
      lastSync: new Date(),
    };
  }

  /**
   * Clone a repository
   */
  static async cloneRepository(url: string, targetPath: string, branch?: string): Promise<GitRepository> {
    Logger.section('Cloning Repository');
    Logger.info(`Cloning from ${url}...`);

    const branchArg = branch ? `-b ${branch}` : '';
    const result = ShellExecutor.exec(`git clone ${branchArg} ${url} ${targetPath}`);

    if (result.code !== 0) {
      throw new Error(`Failed to clone repository: ${result.stderr}`);
    }

    Logger.success('Repository cloned successfully');

    return this.getRepositoryInfo(targetPath);
  }

  /**
   * Get repository information
   */
  static getRepositoryInfo(repoPath: string): GitRepository {
    const remoteResult = ShellExecutor.exec('git remote get-url origin', { cwd: repoPath });
    const url = remoteResult.code === 0 ? remoteResult.stdout : '';

    const branch = this.getCurrentBranch(repoPath);

    return {
      name: path.basename(repoPath),
      url,
      branch,
      path: repoPath,
      remote: 'origin',
      status: this.getStatus(repoPath),
    };
  }

  /**
   * Get current branch name
   */
  static getCurrentBranch(repoPath: string): string {
    const result = ShellExecutor.exec('git branch --show-current', { cwd: repoPath });
    return result.code === 0 ? result.stdout : 'main';
  }

  /**
   * Get repository status
   */
  static getStatus(repoPath: string): RepositoryStatus {
    const branch = this.getCurrentBranch(repoPath);

    // Get ahead/behind counts
    const trackingResult = ShellExecutor.exec(
      'git rev-list --left-right --count HEAD...@{upstream}',
      { cwd: repoPath }
    );
    const [ahead = '0', behind = '0'] = trackingResult.stdout.split(/\s+/);

    // Get file status
    const statusResult = ShellExecutor.exec('git status --porcelain', { cwd: repoPath });
    const statusLines = statusResult.stdout.split('\n').filter(Boolean);

    let modified = 0;
    let added = 0;
    let deleted = 0;
    let untracked = 0;

    statusLines.forEach((line) => {
      const status = line.substring(0, 2);
      if (status.includes('M')) modified++;
      if (status.includes('A')) added++;
      if (status.includes('D')) deleted++;
      if (status.includes('?')) untracked++;
    });

    return {
      branch,
      ahead: parseInt(ahead),
      behind: parseInt(behind),
      modified,
      added,
      deleted,
      untracked,
      clean: statusLines.length === 0,
    };
  }

  /**
   * Get commit history
   */
  static getCommitHistory(repoPath: string, limit: number = 20): GitCommit[] {
    const format = '%H|%an|%ae|%at|%s';
    const result = ShellExecutor.exec(
      `git log -${limit} --pretty=format:"${format}"`,
      { cwd: repoPath }
    );

    if (result.code !== 0) {
      return [];
    }

    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, author, email, timestamp, message] = line.split('|');
        
        // Get files changed in this commit
        const filesResult = ShellExecutor.exec(
          `git show --name-only --pretty="" ${hash}`,
          { cwd: repoPath }
        );
        const files = filesResult.stdout.split('\n').filter(Boolean);

        return {
          hash,
          author,
          email,
          date: new Date(parseInt(timestamp) * 1000),
          message,
          files,
        };
      });
  }

  /**
   * Get commit statistics
   */
  static getCommitStats(repoPath: string, commitHash: string): CommitStats {
    const result = ShellExecutor.exec(
      `git show --stat --format="" ${commitHash}`,
      { cwd: repoPath }
    );

    let additions = 0;
    let deletions = 0;
    let files = 0;

    if (result.code === 0) {
      const lines = result.stdout.split('\n');
      const summaryLine = lines[lines.length - 2];
      
      if (summaryLine) {
        const match = summaryLine.match(/(\d+) files? changed(?:, (\d+) insertions?)?(?:, (\d+) deletions?)?/);
        if (match) {
          files = parseInt(match[1] || '0');
          additions = parseInt(match[2] || '0');
          deletions = parseInt(match[3] || '0');
        }
      }
    }

    return { additions, deletions, files };
  }

  /**
   * Get branches
   */
  static getBranches(repoPath: string): GitBranch[] {
    const result = ShellExecutor.exec('git branch -a -v', { cwd: repoPath });

    if (result.code !== 0) {
      return [];
    }

    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const current = line.startsWith('*');
        const parts = line.replace('*', '').trim().split(/\s+/);
        const name = parts[0];
        const remote = name.startsWith('remotes/');

        return {
          name: remote ? name.replace('remotes/origin/', '') : name,
          current,
          remote,
        };
      });
  }

  /**
   * Switch branch
   */
  static async switchBranch(repoPath: string, branchName: string): Promise<void> {
    Logger.info(`Switching to branch: ${branchName}`);

    const result = ShellExecutor.exec(`git checkout ${branchName}`, { cwd: repoPath });

    if (result.code !== 0) {
      throw new Error(`Failed to switch branch: ${result.stderr}`);
    }

    Logger.success(`Switched to branch: ${branchName}`);
  }

  /**
   * Pull latest changes
   */
  static async pull(repoPath: string): Promise<void> {
    Logger.info('Pulling latest changes...');

    const result = ShellExecutor.exec('git pull', { cwd: repoPath });

    if (result.code !== 0) {
      throw new Error(`Failed to pull: ${result.stderr}`);
    }

    Logger.success('Repository updated');
  }

  /**
   * Commit changes
   */
  static async commit(repoPath: string, message: string, files?: string[]): Promise<void> {
    // Add files
    const addCommand = files && files.length > 0 ? `git add ${files.join(' ')}` : 'git add .';
    const addResult = ShellExecutor.exec(addCommand, { cwd: repoPath });

    if (addResult.code !== 0) {
      throw new Error(`Failed to add files: ${addResult.stderr}`);
    }

    // Commit
    const commitResult = ShellExecutor.exec(`git commit -m "${message}"`, { cwd: repoPath });

    if (commitResult.code !== 0) {
      throw new Error(`Failed to commit: ${commitResult.stderr}`);
    }

    Logger.success('Changes committed');
  }

  /**
   * Push changes
   */
  static async push(repoPath: string, branch?: string): Promise<void> {
    const branchArg = branch || this.getCurrentBranch(repoPath);
    Logger.info(`Pushing to ${branchArg}...`);

    const result = ShellExecutor.exec(`git push origin ${branchArg}`, { cwd: repoPath });

    if (result.code !== 0) {
      throw new Error(`Failed to push: ${result.stderr}`);
    }

    Logger.success('Changes pushed');
  }

  /**
   * Sync repository (pull + push)
   */
  static async sync(repoPath: string): Promise<SyncOperation> {
    const syncOp: SyncOperation = {
      id: Date.now().toString(),
      repository: path.basename(repoPath),
      status: 'running',
      startedAt: new Date(),
      changes: 0,
      logs: [],
    };

    try {
      // Check status before sync
      const statusBefore = this.getStatus(repoPath);
      syncOp.logs?.push(`Branch: ${statusBefore.branch}`);
      syncOp.logs?.push(`Behind: ${statusBefore.behind}, Ahead: ${statusBefore.ahead}`);

      // Pull changes
      await this.pull(repoPath);
      syncOp.logs?.push('Pulled latest changes');

      // Push if we have local commits
      if (statusBefore.ahead > 0) {
        await this.push(repoPath);
        syncOp.logs?.push('Pushed local commits');
      }

      syncOp.changes = statusBefore.behind + statusBefore.ahead;
      syncOp.status = 'success';
      syncOp.completedAt = new Date();

      Logger.success('Repository synced successfully');
    } catch (error) {
      syncOp.status = 'failed';
      syncOp.errors = [(error as Error).message];
      syncOp.completedAt = new Date();
      Logger.error(`Sync failed: ${(error as Error).message}`);
    }

    return syncOp;
  }

  /**
   * Load GitOps configuration
   */
  static loadConfig(projectPath: string): GitOpsConfig | null {
    const configPath = path.join(projectPath, this.CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content) as GitOpsConfig;
    } catch (error) {
      Logger.error(`Failed to load GitOps config: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Save GitOps configuration
   */
  static saveConfig(projectPath: string, config: GitOpsConfig): void {
    const configPath = path.join(projectPath, this.CONFIG_FILE);
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    Logger.success('GitOps configuration saved');
  }

  /**
   * Enable GitOps for project
   */
  static async enableGitOps(projectPath: string, repository: GitRepository): Promise<void> {
    const config: GitOpsConfig = {
      enabled: true,
      repositories: [repository],
      autoSync: false,
      syncInterval: 15,
    };

    this.saveConfig(projectPath, config);
    Logger.success('GitOps enabled for project');
  }

  /**
   * Disable GitOps for project
   */
  static async disableGitOps(projectPath: string): Promise<void> {
    const configPath = path.join(projectPath, this.CONFIG_FILE);

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      Logger.success('GitOps disabled for project');
    }
  }
}
