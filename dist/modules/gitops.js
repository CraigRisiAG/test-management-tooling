"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitOpsModule = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const shell_1 = require("../utils/shell");
/**
 * GitOps Module - Git repository management and GitOps operations
 */
class GitOpsModule {
    static CONFIG_FILE = '.zebrunner/gitops.json';
    /**
     * Initialize a Git repository
     */
    static async initRepository(repoPath, url) {
        logger_1.Logger.section('Initializing Git Repository');
        if (!fs_1.default.existsSync(repoPath)) {
            fs_1.default.mkdirSync(repoPath, { recursive: true });
        }
        // Check if already a git repository
        const isGitRepo = fs_1.default.existsSync(path_1.default.join(repoPath, '.git'));
        if (!isGitRepo) {
            const result = shell_1.ShellExecutor.exec('git init', { cwd: repoPath });
            if (result.code !== 0) {
                throw new Error(`Failed to initialize repository: ${result.stderr}`);
            }
            logger_1.Logger.success(`Repository initialized at ${repoPath}`);
        }
        // Add remote if URL provided
        if (url) {
            const remoteResult = shell_1.ShellExecutor.exec(`git remote add origin ${url}`, { cwd: repoPath });
            if (remoteResult.code !== 0 && !remoteResult.stderr.includes('already exists')) {
                logger_1.Logger.warn(`Could not add remote: ${remoteResult.stderr}`);
            }
        }
        const branch = this.getCurrentBranch(repoPath);
        return {
            name: path_1.default.basename(repoPath),
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
    static async cloneRepository(url, targetPath, branch) {
        logger_1.Logger.section('Cloning Repository');
        logger_1.Logger.info(`Cloning from ${url}...`);
        const branchArg = branch ? `-b ${branch}` : '';
        const result = shell_1.ShellExecutor.exec(`git clone ${branchArg} ${url} ${targetPath}`);
        if (result.code !== 0) {
            throw new Error(`Failed to clone repository: ${result.stderr}`);
        }
        logger_1.Logger.success('Repository cloned successfully');
        return this.getRepositoryInfo(targetPath);
    }
    /**
     * Get repository information
     */
    static getRepositoryInfo(repoPath) {
        const remoteResult = shell_1.ShellExecutor.exec('git remote get-url origin', { cwd: repoPath });
        const url = remoteResult.code === 0 ? remoteResult.stdout : '';
        const branch = this.getCurrentBranch(repoPath);
        return {
            name: path_1.default.basename(repoPath),
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
    static getCurrentBranch(repoPath) {
        const result = shell_1.ShellExecutor.exec('git branch --show-current', { cwd: repoPath });
        return result.code === 0 ? result.stdout : 'main';
    }
    /**
     * Get repository status
     */
    static getStatus(repoPath) {
        const branch = this.getCurrentBranch(repoPath);
        // Get ahead/behind counts
        const trackingResult = shell_1.ShellExecutor.exec('git rev-list --left-right --count HEAD...@{upstream}', { cwd: repoPath });
        const [ahead = '0', behind = '0'] = trackingResult.stdout.split(/\s+/);
        // Get file status
        const statusResult = shell_1.ShellExecutor.exec('git status --porcelain', { cwd: repoPath });
        const statusLines = statusResult.stdout.split('\n').filter(Boolean);
        let modified = 0;
        let added = 0;
        let deleted = 0;
        let untracked = 0;
        statusLines.forEach((line) => {
            const status = line.substring(0, 2);
            if (status.includes('M'))
                modified++;
            if (status.includes('A'))
                added++;
            if (status.includes('D'))
                deleted++;
            if (status.includes('?'))
                untracked++;
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
    static getCommitHistory(repoPath, limit = 20) {
        const format = '%H|%an|%ae|%at|%s';
        const result = shell_1.ShellExecutor.exec(`git log -${limit} --pretty=format:"${format}"`, { cwd: repoPath });
        if (result.code !== 0) {
            return [];
        }
        return result.stdout
            .split('\n')
            .filter(Boolean)
            .map((line) => {
            const [hash, author, email, timestamp, message] = line.split('|');
            // Get files changed in this commit
            const filesResult = shell_1.ShellExecutor.exec(`git show --name-only --pretty="" ${hash}`, { cwd: repoPath });
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
    static getCommitStats(repoPath, commitHash) {
        const result = shell_1.ShellExecutor.exec(`git show --stat --format="" ${commitHash}`, { cwd: repoPath });
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
    static getBranches(repoPath) {
        const result = shell_1.ShellExecutor.exec('git branch -a -v', { cwd: repoPath });
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
    static async switchBranch(repoPath, branchName) {
        logger_1.Logger.info(`Switching to branch: ${branchName}`);
        const result = shell_1.ShellExecutor.exec(`git checkout ${branchName}`, { cwd: repoPath });
        if (result.code !== 0) {
            throw new Error(`Failed to switch branch: ${result.stderr}`);
        }
        logger_1.Logger.success(`Switched to branch: ${branchName}`);
    }
    /**
     * Pull latest changes
     */
    static async pull(repoPath) {
        logger_1.Logger.info('Pulling latest changes...');
        const result = shell_1.ShellExecutor.exec('git pull', { cwd: repoPath });
        if (result.code !== 0) {
            throw new Error(`Failed to pull: ${result.stderr}`);
        }
        logger_1.Logger.success('Repository updated');
    }
    /**
     * Commit changes
     */
    static async commit(repoPath, message, files) {
        // Add files
        const addCommand = files && files.length > 0 ? `git add ${files.join(' ')}` : 'git add .';
        const addResult = shell_1.ShellExecutor.exec(addCommand, { cwd: repoPath });
        if (addResult.code !== 0) {
            throw new Error(`Failed to add files: ${addResult.stderr}`);
        }
        // Commit
        const commitResult = shell_1.ShellExecutor.exec(`git commit -m "${message}"`, { cwd: repoPath });
        if (commitResult.code !== 0) {
            throw new Error(`Failed to commit: ${commitResult.stderr}`);
        }
        logger_1.Logger.success('Changes committed');
    }
    /**
     * Push changes
     */
    static async push(repoPath, branch) {
        const branchArg = branch || this.getCurrentBranch(repoPath);
        logger_1.Logger.info(`Pushing to ${branchArg}...`);
        const result = shell_1.ShellExecutor.exec(`git push origin ${branchArg}`, { cwd: repoPath });
        if (result.code !== 0) {
            throw new Error(`Failed to push: ${result.stderr}`);
        }
        logger_1.Logger.success('Changes pushed');
    }
    /**
     * Sync repository (pull + push)
     */
    static async sync(repoPath) {
        const syncOp = {
            id: Date.now().toString(),
            repository: path_1.default.basename(repoPath),
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
            const statusAfter = this.getStatus(repoPath);
            syncOp.changes = statusBefore.behind + statusBefore.ahead;
            syncOp.status = 'success';
            syncOp.completedAt = new Date();
            logger_1.Logger.success('Repository synced successfully');
        }
        catch (error) {
            syncOp.status = 'failed';
            syncOp.errors = [error.message];
            syncOp.completedAt = new Date();
            logger_1.Logger.error(`Sync failed: ${error.message}`);
        }
        return syncOp;
    }
    /**
     * Load GitOps configuration
     */
    static loadConfig(projectPath) {
        const configPath = path_1.default.join(projectPath, this.CONFIG_FILE);
        if (!fs_1.default.existsSync(configPath)) {
            return null;
        }
        try {
            const content = fs_1.default.readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            logger_1.Logger.error(`Failed to load GitOps config: ${error.message}`);
            return null;
        }
    }
    /**
     * Save GitOps configuration
     */
    static saveConfig(projectPath, config) {
        const configPath = path_1.default.join(projectPath, this.CONFIG_FILE);
        const configDir = path_1.default.dirname(configPath);
        if (!fs_1.default.existsSync(configDir)) {
            fs_1.default.mkdirSync(configDir, { recursive: true });
        }
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logger_1.Logger.success('GitOps configuration saved');
    }
    /**
     * Enable GitOps for project
     */
    static async enableGitOps(projectPath, repository) {
        const config = {
            enabled: true,
            repositories: [repository],
            autoSync: false,
            syncInterval: 15,
        };
        this.saveConfig(projectPath, config);
        logger_1.Logger.success('GitOps enabled for project');
    }
    /**
     * Disable GitOps for project
     */
    static async disableGitOps(projectPath) {
        const configPath = path_1.default.join(projectPath, this.CONFIG_FILE);
        if (fs_1.default.existsSync(configPath)) {
            fs_1.default.unlinkSync(configPath);
            logger_1.Logger.success('GitOps disabled for project');
        }
    }
}
exports.GitOpsModule = GitOpsModule;
//# sourceMappingURL=gitops.js.map