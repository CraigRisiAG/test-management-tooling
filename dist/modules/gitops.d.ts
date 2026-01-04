import { GitRepository, RepositoryStatus, GitCommit, GitBranch, GitOpsConfig, SyncOperation, CommitStats } from '../types';
/**
 * GitOps Module - Git repository management and GitOps operations
 */
export declare class GitOpsModule {
    private static readonly CONFIG_FILE;
    /**
     * Initialize a Git repository
     */
    static initRepository(repoPath: string, url?: string): Promise<GitRepository>;
    /**
     * Clone a repository
     */
    static cloneRepository(url: string, targetPath: string, branch?: string): Promise<GitRepository>;
    /**
     * Get repository information
     */
    static getRepositoryInfo(repoPath: string): GitRepository;
    /**
     * Get current branch name
     */
    static getCurrentBranch(repoPath: string): string;
    /**
     * Get repository status
     */
    static getStatus(repoPath: string): RepositoryStatus;
    /**
     * Get commit history
     */
    static getCommitHistory(repoPath: string, limit?: number): GitCommit[];
    /**
     * Get commit statistics
     */
    static getCommitStats(repoPath: string, commitHash: string): CommitStats;
    /**
     * Get branches
     */
    static getBranches(repoPath: string): GitBranch[];
    /**
     * Switch branch
     */
    static switchBranch(repoPath: string, branchName: string): Promise<void>;
    /**
     * Pull latest changes
     */
    static pull(repoPath: string): Promise<void>;
    /**
     * Commit changes
     */
    static commit(repoPath: string, message: string, files?: string[]): Promise<void>;
    /**
     * Push changes
     */
    static push(repoPath: string, branch?: string): Promise<void>;
    /**
     * Sync repository (pull + push)
     */
    static sync(repoPath: string): Promise<SyncOperation>;
    /**
     * Load GitOps configuration
     */
    static loadConfig(projectPath: string): GitOpsConfig | null;
    /**
     * Save GitOps configuration
     */
    static saveConfig(projectPath: string, config: GitOpsConfig): void;
    /**
     * Enable GitOps for project
     */
    static enableGitOps(projectPath: string, repository: GitRepository): Promise<void>;
    /**
     * Disable GitOps for project
     */
    static disableGitOps(projectPath: string): Promise<void>;
}
//# sourceMappingURL=gitops.d.ts.map