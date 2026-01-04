import { GitOpsModule } from '../gitops';
import { RepositoryViewerModule } from '../repository-viewer';
import fs from 'fs';
import path from 'path';

describe('GitOpsModule', () => {
  describe('getCurrentBranch', () => {
    it('should return branch name', () => {
      const branch = GitOpsModule.getCurrentBranch(process.cwd());
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    });
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information', () => {
      const info = GitOpsModule.getRepositoryInfo(process.cwd());
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('url');
      expect(info).toHaveProperty('branch');
      expect(info).toHaveProperty('path');
    });
  });

  describe('getStatus', () => {
    it('should return repository status', () => {
      const status = GitOpsModule.getStatus(process.cwd());
      
      expect(status).toHaveProperty('branch');
      expect(status).toHaveProperty('ahead');
      expect(status).toHaveProperty('behind');
      expect(status).toHaveProperty('modified');
      expect(status).toHaveProperty('clean');
      expect(typeof status.clean).toBe('boolean');
    });
  });

  describe('getCommitHistory', () => {
    it('should return array of commits', () => {
      const commits = GitOpsModule.getCommitHistory(process.cwd(), 5);
      
      expect(Array.isArray(commits)).toBe(true);
      if (commits.length > 0) {
        expect(commits[0]).toHaveProperty('hash');
        expect(commits[0]).toHaveProperty('author');
        expect(commits[0]).toHaveProperty('message');
        expect(commits[0]).toHaveProperty('date');
      }
    });
  });

  describe('getBranches', () => {
    it('should return array of branches', () => {
      const branches = GitOpsModule.getBranches(process.cwd());
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      
      const currentBranch = branches.find((b) => b.current);
      expect(currentBranch).toBeDefined();
    });
  });

  describe('loadConfig', () => {
    it('should return null for non-existent config', () => {
      const config = GitOpsModule.loadConfig('/tmp/nonexistent');
      expect(config).toBeNull();
    });
  });
});

describe('RepositoryViewerModule', () => {
  describe('buildFileTree', () => {
    it('should build file tree structure', () => {
      const tree = RepositoryViewerModule.buildFileTree(process.cwd(), 2);
      
      expect(tree).toHaveProperty('name');
      expect(tree).toHaveProperty('path');
      expect(tree).toHaveProperty('type');
      expect(tree.type).toBe('directory');
    });
  });

  describe('getFileContent', () => {
    it('should read file content', () => {
      // Test with package.json
      const content = RepositoryViewerModule.getFileContent(process.cwd(), 'package.json');
      
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('zebrunner');
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        RepositoryViewerModule.getFileContent(process.cwd(), 'nonexistent.txt');
      }).toThrow();
    });
  });

  describe('searchFiles', () => {
    it('should search for files by pattern', () => {
      const files = RepositoryViewerModule.searchFiles(process.cwd(), 'package');
      
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.includes('package'))).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('should return repository summary', () => {
      const summary = RepositoryViewerModule.getSummary(process.cwd());
      
      expect(summary).toHaveProperty('totalFiles');
      expect(summary).toHaveProperty('totalCommits');
      expect(summary).toHaveProperty('totalAuthors');
      expect(summary).toHaveProperty('languages');
      expect(typeof summary.totalFiles).toBe('number');
      expect(typeof summary.languages).toBe('object');
    });
  });

  describe('getDiff', () => {
    it('should return diff array', () => {
      const diffs = RepositoryViewerModule.getDiff(process.cwd());
      
      expect(Array.isArray(diffs)).toBe(true);
      // May be empty if no changes
    });
  });

  describe('getWorkingDiff', () => {
    it('should return working tree diffs', () => {
      const diffs = RepositoryViewerModule.getWorkingDiff(process.cwd());
      
      expect(Array.isArray(diffs)).toBe(true);
    });
  });
});
