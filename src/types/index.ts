/**
 * Type definitions for Custom Test Management Platform
 */

// Custom Test Management Types
export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'draft' | 'ready' | 'in-progress' | 'testing' | 'done';
  linkedTests: string[];
  linkedCode: CodeReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeReference {
  filePath: string;
  lineStart: number;
  lineEnd: number;
  functionName?: string;
  className?: string;
  hash: string;
}

export interface TestCase {
  id: string;
  storyId: string;
  name: string;
  description: string;
  type: 'manual' | 'automated';
  status: 'pending' | 'passed' | 'failed' | 'blocked';
  steps?: ManualTestStep[];
  automatedScript?: string;
  codeReferences: CodeReference[];
  lastRun?: Date;
  results: TestResult[];
}

export interface ManualTestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  actualResult?: string;
  status?: 'pending' | 'passed' | 'failed';
}

export interface TestResult {
  id: string;
  testId: string;
  executedAt: Date;
  executedBy: string;
  status: 'passed' | 'failed' | 'blocked';
  duration: number;
  error?: string;
  screenshots?: string[];
  logs?: string[];
  linkedIssues?: string[];
}

export interface TraceabilityMatrix {
  storyId: string;
  testCases: string[];
  codeFiles: string[];
  coveragePercentage: number;
}

export interface TestManagementConfig {
  dataDir: string;
  workspaceRoot: string;
  defaultExecutor: string;
}

// Defect and Issue Management Types
export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'defect' | 'enhancement' | 'task';
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'reopened' | 'wontfix';
  assignee?: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  linkedTests: string[];
  linkedCode: CodeReference[];
  linkedStories: string[];
  comments: IssueComment[];
  attachments?: string[];
  tags?: string[];
  reproductionSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface IssueComment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Defect {
  id: string;
  issueId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  status: 'new' | 'assigned' | 'in-progress' | 'fixed' | 'verified' | 'closed';
  detectedIn: string; // Test ID
  detectedAt: Date;
  detectedBy: string;
  affectedCode: CodeReference[];
  rootCause?: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  linkedPullRequests?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface IssueMetrics {
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  averageResolutionTime?: number;
  issuesByStatus: Record<string, number>;
  issuesBySeverity: Record<string, number>;
}

export interface DefectMetrics {
  totalDefects: number;
  newDefects: number;
  fixedDefects: number;
  unverifiedDefects: number;
  defectsByStatus: Record<string, number>;
  defectsBySeverity: Record<string, number>;
  criticalDefects: Defect[];
}

export interface IssueFilter {
  type?: string;
  severity?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  linkedTest?: string;
  linkedStory?: string;
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

// ==================== Agile Board Types ====================

export type BoardStatus = 'active' | 'archived' | 'completed';
export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';
export type StoryStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'testing' | 'done';
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type StoryType = 'feature' | 'bug' | 'chore' | 'spike';

export interface AgileBoard {
  id: string;
  name: string;
  description?: string;
  status: BoardStatus;
  createdAt: Date;
  updatedAt: Date;
  sprints: Sprint[];
  backlog: Story[];
  settings: BoardSettings;
}

export interface BoardSettings {
  sprintDurationWeeks: number;
  storyPointScale: number[]; // e.g., [1, 2, 3, 5, 8, 13, 21]
  columns: BoardColumn[];
  autoArchiveSprints: boolean;
  requireEstimates: boolean;
}

export interface BoardColumn {
  id: string;
  name: string;
  status: StoryStatus;
  wipLimit?: number; // Work-in-progress limit
  position: number;
}

export interface Sprint {
  id: string;
  boardId: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  stories: Story[];
  velocity?: number; // Completed story points
  createdAt: Date;
}

export interface Story {
  id: string;
  boardId: string;
  sprintId?: string; // null if in backlog
  title: string;
  description?: string;
  type: StoryType;
  status: StoryStatus;
  priority: Priority;
  estimate?: number; // Story points
  assignee?: string;
  reporter: string;
  tags: string[];
  tasks: Task[];
  testLinks: TestLink[];
  repositoryLinks: RepositoryLink[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  estimatedHours?: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface TestLink {
  id: string;
  storyId: string;
  testId: string;
  testName: string;
  testType: 'unit' | 'integration' | 'e2e' | 'performance';
  testPath: string; // File path to test
  coverage?: TestCoverage;
  status: 'passing' | 'failing' | 'skipped';
  linkedAt: Date;
}

export interface TestCoverage {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
  percentage: number;
}

export interface RepositoryLink {
  id: string;
  storyId: string;
  repositoryUrl: string;
  branch?: string;
  commits: string[]; // Commit hashes
  filePaths: string[]; // Files changed for this story
  linkedAt: Date;
}

export interface Comment {
  id: string;
  storyId: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SprintMetrics {
  sprintId: string;
  totalStories: number;
  completedStories: number;
  totalPoints: number;
  completedPoints: number;
  velocity: number;
  burndownData: BurndownPoint[];
  testCoverage: number;
}

export interface BurndownPoint {
  date: Date;
  remainingPoints: number;
  idealRemaining: number;
}

export interface BoardMetrics {
  boardId: string;
  totalStories: number;
  storiesByStatus: Record<StoryStatus, number>;
  storiesByPriority: Record<Priority, number>;
  averageVelocity: number;
  averageCycleTime: number; // Days from start to done
  testCoveragePercentage: number;
  completedSprints: number;
}

export interface AgileBoardConfig {
  enabled: boolean;
  defaultBoard?: string;
  boards: AgileBoard[];
  gitOpsIntegration: boolean;
  autoLinkTests: boolean;
  autoLinkCommits: boolean;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  sprintStartReminder: boolean;
  sprintEndReminder: boolean;
  storyAssigned: boolean;
  testFailures: boolean;
}
