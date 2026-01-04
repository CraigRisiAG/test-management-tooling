import { FileTreeNode, GitDiff } from '../types';
/**
 * Repository Viewer Module - Browse repository files and view diffs
 */
export declare class RepositoryViewerModule {
    /**
     * Build file tree from repository path
     */
    static buildFileTree(repoPath: string, maxDepth?: number): FileTreeNode;
    /**
     * Display file tree in console
     */
    static displayFileTree(tree: FileTreeNode, indent?: string, isLast?: boolean): void;
    /**
     * Get file content from repository
     */
    static getFileContent(repoPath: string, filePath: string): string;
    /**
     * Get file from specific commit
     */
    static getFileAtCommit(repoPath: string, commitHash: string, filePath: string): string;
    /**
     * Get diff between commits
     */
    static getDiff(repoPath: string, fromCommit?: string, toCommit?: string): GitDiff[];
    /**
     * Get working tree diff
     */
    static getWorkingDiff(repoPath: string): GitDiff[];
    /**
     * Parse git diff output
     */
    private static parseDiff;
    /**
     * Display diff in console
     */
    static displayDiff(diffs: GitDiff[]): void;
    /**
     * Search files in repository
     */
    static searchFiles(repoPath: string, pattern: string): string[];
    /**
     * Search content in repository
     */
    static searchContent(repoPath: string, searchTerm: string): Array<{
        file: string;
        line: number;
        content: string;
    }>;
    /**
     * Get file statistics
     */
    static getFileStats(repoPath: string): Array<{
        file: string;
        commits: number;
        authors: number;
    }>;
    /**
     * Format file size
     */
    private static formatFileSize;
    /**
     * Get repository summary
     */
    static getSummary(repoPath: string): {
        totalFiles: number;
        totalCommits: number;
        totalAuthors: number;
        languages: Record<string, number>;
    };
}
//# sourceMappingURL=repository-viewer.d.ts.map