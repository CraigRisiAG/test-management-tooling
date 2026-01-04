import { CodeReference } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Traces relationships between code and tests
 */
export class CodeTracer {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Create code reference from file and line numbers
   */
  async createReference(
    filePath: string,
    lineStart: number,
    lineEnd: number,
    gitHash?: string
  ): Promise<CodeReference> {
    const absolutePath = path.resolve(this.workspaceRoot, filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract function/class name from code
    const codeSnippet = lines.slice(lineStart - 1, lineEnd).join('\n');
    const functionMatch = codeSnippet.match(/function\s+(\w+)/);
    const classMatch = codeSnippet.match(/class\s+(\w+)/);

    // Generate content hash for change detection
    const hash = gitHash || this.generateHash(codeSnippet);

    return {
      filePath,
      lineStart,
      lineEnd,
      functionName: functionMatch?.[1],
      className: classMatch?.[1],
      hash,
    };
  }

  /**
   * Check if code has changed since reference was created
   */
  async hasCodeChanged(reference: CodeReference): Promise<boolean> {
    try {
      const absolutePath = path.resolve(this.workspaceRoot, reference.filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      const lines = content.split('\n');
      const currentSnippet = lines.slice(reference.lineStart - 1, reference.lineEnd).join('\n');
      const currentHash = this.generateHash(currentSnippet);

      return currentHash !== reference.hash;
    } catch (error) {
      return true; // File might have been deleted
    }
  }

  /**
   * Find all test files that reference a specific code file
   */
  async findTestsForCode(filePath: string): Promise<string[]> {
    // This would search through test files for imports/references
    // Implementation depends on your test framework
    const testFiles: string[] = [];
    const testsDir = path.join(this.workspaceRoot, 'tests');
    
    try {
      const files = await this.getTestFiles(testsDir);
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        if (content.includes(filePath)) {
          testFiles.push(file);
        }
      }
    } catch (error) {
      // Tests directory doesn't exist
    }

    return testFiles;
  }

  /**
   * Get all changed code references in a story
   */
  async getChangedReferences(references: CodeReference[]): Promise<CodeReference[]> {
    const changed: CodeReference[] = [];
    
    for (const ref of references) {
      if (await this.hasCodeChanged(ref)) {
        changed.push(ref);
      }
    }

    return changed;
  }

  private async getTestFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getTestFiles(fullPath));
      } else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
