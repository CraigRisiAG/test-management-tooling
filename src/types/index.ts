/**
 * Type definitions for Zebrunner platform
 */

export interface ZebrunnerConfig {
  protocol: string;
  hostname: string;
  port: string;
  reporting?: ServiceConfig;
  sonarqube?: ServiceConfig;
  jenkins?: ServiceConfig;
  selenoid?: ServiceConfig;
  mcloud?: ServiceConfig;
}

export interface ServiceConfig {
  enabled: boolean;
  version?: string;
  port?: number;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

export interface BackupData {
  timestamp: string;
  version: string;
  services: string[];
  files: string[];
}

export interface SetupOptions {
  enableReporting?: boolean;
  enableSonarqube?: boolean;
  enableJenkins?: boolean;
  enableSelenoid?: boolean;
  enableMcloud?: boolean;
  interactive?: boolean;
}

export interface DockerComposeService {
  image: string;
  container_name: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  depends_on?: string[];
}

export interface DockerComposeConfig {
  version: string;
  services: Record<string, DockerComposeService>;
  networks?: Record<string, unknown>;
  volumes?: Record<string, unknown>;
}

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface VersionInfo {
  service: string;
  version: string;
  image: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

// Git/GitOps Types
export interface GitRepository {
  name: string;
  url: string;
  branch: string;
  path: string;
  remote?: string;
  lastSync?: Date;
  status?: RepositoryStatus;
}

export interface RepositoryStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
  clean: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  files: string[];
  stats?: CommitStats;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  files: number;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote: boolean;
  upstream?: string;
  lastCommit?: GitCommit;
}

export interface GitFile {
  path: string;
  type: 'blob' | 'tree';
  mode: string;
  size: number;
  content?: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  chunks: DiffChunk[];
}

export interface DiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface GitOpsConfig {
  enabled: boolean;
  repositories: GitRepository[];
  syncInterval?: number; // minutes
  autoSync?: boolean;
  webhookUrl?: string;
  notifications?: {
    onSync?: boolean;
    onError?: boolean;
    channels?: string[];
  };
}

export interface ProjectConfig {
  projectId: string;
  projectName: string;
  repository: GitRepository;
  gitops: GitOpsConfig;
  environments?: EnvironmentConfig[];
}

export interface EnvironmentConfig {
  name: string;
  branch: string;
  path: string;
  variables?: Record<string, string>;
  secrets?: string[];
}

export interface SyncOperation {
  id: string;
  repository: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  changes: number;
  errors?: string[];
  logs?: string[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
  expanded?: boolean;
}
