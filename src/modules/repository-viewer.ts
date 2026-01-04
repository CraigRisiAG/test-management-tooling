import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Logger } from '../utils/logger';
import { ShellExecutor } from '../utils/shell';
import { GitFile, FileTreeNode, GitDiff, DiffChunk, DiffLine } from '../types';

/**
 * Repository Viewer Module - Browse repository files and view diffs
 */
export class RepositoryViewerModule {
  /**
   * Build file tree from repository path
   */
  static buildFileTree(repoPath: string, maxDepth: number = 3): FileTreeNode {
    const rootName = path.basename(repoPath);

    const buildNode = (dirPath: string, depth: number): FileTreeNode => {
      const stats = fs.statSync(dirPath);
      const name = path.basename(dirPath);

      if (stats.isFile()) {
        return {
          name,
          path: dirPath,
          type: 'file',
          size: stats.size,
        };
      }

      // Directory
      const node: FileTreeNode = {
        name,
        path: dirPath,
        type: 'directory',
        children: [],
      };

      if (depth >= maxDepth) {
        return node;
      }

      try {
        const entries = fs.readdirSync(dirPath);
        
        // Filter out .git and node_modules
        const filtered = entries.filter(
          (entry) => entry !== '.git' && entry !== 'node_modules' && entry !== 'dist'
        );

        node.children = filtered
          .map((entry) => buildNode(path.join(dirPath, entry), depth + 1))
          .sort((a, b) => {
            // Directories first, then files
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
          });
      } catch (error) {
        Logger.debug(`Cannot read directory: ${dirPath}`);
      }

      return node;
    };

    return buildNode(repoPath, 0);
  }

  /**
   * Display file tree in console
   */
  static displayFileTree(tree: FileTreeNode, indent: string = '', isLast: boolean = true): void {
    const prefix = isLast ? '└── ' : '├── ';
    const icon = tree.type === 'directory' ? '📁' : '📄';
    const sizeStr = tree.size ? ` (${this.formatFileSize(tree.size)})` : '';

    console.log(
      indent +
        prefix +
        icon +
        ' ' +
        (tree.type === 'directory' ? chalk.blue(tree.name) : chalk.white(tree.name)) +
        chalk.gray(sizeStr)
    );

    if (tree.children && tree.children.length > 0) {
      const newIndent = indent + (isLast ? '    ' : '│   ');
      tree.children.forEach((child, index) => {
        const childIsLast = index === tree.children!.length - 1;
        this.displayFileTree(child, newIndent, childIsLast);
      });
    }
  }

  /**
   * Get file content from repository
   */
  static getFileContent(repoPath: string, filePath: string): string {
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Get file from specific commit
   */
  static getFileAtCommit(repoPath: string, commitHash: string, filePath: string): string {
    const result = ShellExecutor.exec(`git show ${commitHash}:${filePath}`, { cwd: repoPath });

    if (result.code !== 0) {
      throw new Error(`Failed to get file: ${result.stderr}`);
    }

    return result.stdout;
  }

  /**
   * Get diff between commits
   */
  static getDiff(
    repoPath: string,
    fromCommit: string = 'HEAD~1',
    toCommit: string = 'HEAD'
  ): GitDiff[] {
    const result = ShellExecutor.exec(`git diff ${fromCommit} ${toCommit} --unified=3`, {
      cwd: repoPath,
    });

    if (result.code !== 0) {
      return [];
    }

    return this.parseDiff(result.stdout);
  }

  /**
   * Get working tree diff
   */
  static getWorkingDiff(repoPath: string): GitDiff[] {
    const result = ShellExecutor.exec('git diff HEAD --unified=3', { cwd: repoPath });

    if (result.code !== 0) {
      return [];
    }

    return this.parseDiff(result.stdout);
  }

  /**
   * Parse git diff output
   */
  private static parseDiff(diffOutput: string): GitDiff[] {
    const diffs: GitDiff[] = [];
    const files = diffOutput.split('diff --git');

    for (const fileSection of files) {
      if (!fileSection.trim()) continue;

      const lines = fileSection.split('\n');
      const fileLine = lines[0];
      const fileMatch = fileLine.match(/a\/(.*?) b\/(.*)/);

      if (!fileMatch) continue;

      const fileName = fileMatch[2];
      const chunks: DiffChunk[] = [];

      let currentChunk: DiffChunk | null = null;
      let additions = 0;
      let deletions = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Chunk header
        if (line.startsWith('@@')) {
          const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
          if (match) {
            if (currentChunk) {
              chunks.push(currentChunk);
            }

            currentChunk = {
              oldStart: parseInt(match[1]),
              oldLines: parseInt(match[2] || '1'),
              newStart: parseInt(match[3]),
              newLines: parseInt(match[4] || '1'),
              lines: [],
            };
          }
        } else if (currentChunk) {
          // Diff line
          const diffLine: DiffLine = {
            type: 'context',
            content: line.substring(1),
          };

          if (line.startsWith('+')) {
            diffLine.type = 'add';
            additions++;
          } else if (line.startsWith('-')) {
            diffLine.type = 'delete';
            deletions++;
          }

          currentChunk.lines.push(diffLine);
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }

      diffs.push({
        file: fileName,
        additions,
        deletions,
        chunks,
      });
    }

    return diffs;
  }

  /**
   * Display diff in console
   */
  static displayDiff(diffs: GitDiff[]): void {
    for (const diff of diffs) {
      console.log('\n' + chalk.bold.white(`File: ${diff.file}`));
      console.log(
        chalk.green(`+${diff.additions}`) + ' ' + chalk.red(`-${diff.deletions}`) + '\n'
      );

      for (const chunk of diff.chunks) {
        console.log(chalk.cyan(`@@ -${chunk.oldStart},${chunk.oldLines} +${chunk.newStart},${chunk.newLines} @@`));

        for (const line of chunk.lines) {
          if (line.type === 'add') {
            console.log(chalk.green(`+ ${line.content}`));
          } else if (line.type === 'delete') {
            console.log(chalk.red(`- ${line.content}`));
          } else {
            console.log(chalk.gray(`  ${line.content}`));
          }
        }
      }
    }
  }

  /**
   * Search files in repository
   */
  static searchFiles(repoPath: string, pattern: string): string[] {
    const result = ShellExecutor.exec(`git ls-files | grep -i "${pattern}"`, { cwd: repoPath });

    if (result.code !== 0) {
      return [];
    }

    return result.stdout.split('\n').filter(Boolean);
  }

  /**
   * Search content in repository
   */
  static searchContent(
    repoPath: string,
    searchTerm: string
  ): Array<{ file: string; line: number; content: string }> {
    const result = ShellExecutor.exec(`git grep -n "${searchTerm}"`, { cwd: repoPath });

    if (result.code !== 0) {
      return [];
    }

    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [file, lineNum, ...contentParts] = line.split(':');
        return {
          file,
          line: parseInt(lineNum),
          content: contentParts.join(':'),
        };
      });
  }

  /**
   * Get file statistics
   */
  static getFileStats(repoPath: string): Array<{ file: string; commits: number; authors: number }> {
    const files = ShellExecutor.exec('git ls-files', { cwd: repoPath }).stdout.split('\n').filter(Boolean);

    return files.map((file) => {
      const logResult = ShellExecutor.exec(`git log --follow --pretty=format:"%an" -- "${file}"`, {
        cwd: repoPath,
      });

      const authors = new Set(logResult.stdout.split('\n').filter(Boolean));
      const commits = logResult.stdout.split('\n').filter(Boolean).length;

      return {
        file,
        commits,
        authors: authors.size,
      };
    });
  }

  /**
   * Format file size
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get repository summary
   */
  static getSummary(repoPath: string): {
    totalFiles: number;
    totalCommits: number;
    totalAuthors: number;
    languages: Record<string, number>;
  } {
    // Count files
    const filesResult = ShellExecutor.exec('git ls-files | wc -l', { cwd: repoPath });
    const totalFiles = parseInt(filesResult.stdout.trim());

    // Count commits
    const commitsResult = ShellExecutor.exec('git rev-list --all --count', { cwd: repoPath });
    const totalCommits = parseInt(commitsResult.stdout.trim());

    // Count authors
    const authorsResult = ShellExecutor.exec('git log --format="%an" | sort -u | wc -l', {
      cwd: repoPath,
    });
    const totalAuthors = parseInt(authorsResult.stdout.trim());

    // Language statistics (by file extension)
    const langResult = ShellExecutor.exec(
      'git ls-files | sed "s/.*\\.//" | sort | uniq -c | sort -rn',
      { cwd: repoPath }
    );

    const languages: Record<string, number> = {};
    langResult.stdout.split('\n').forEach((line) => {
      const match = line.trim().match(/(\d+)\s+(\w+)/);
      if (match) {
        languages[match[2]] = parseInt(match[1]);
      }
    });

    return {
      totalFiles,
      totalCommits,
      totalAuthors,
      languages,
    };
  }
}
