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

// ==================== Agile Hierarchy Types ====================

/**
 * Portfolio Objective - Highest level strategic goal
 * Maps to business strategy and multi-year initiatives
 */
export interface PortfolioObjective {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'on-track' | 'at-risk' | 'completed' | 'cancelled';
  owner: string;
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  keyResults: KeyResult[];
  linkedGoals: string[]; // Goal IDs
  metrics: PortfolioMetrics;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., '%', 'users', 'revenue'
  status: 'not-started' | 'in-progress' | 'achieved' | 'at-risk';
}

export interface PortfolioMetrics {
  totalGoals: number;
  completedGoals: number;
  progressPercentage: number;
  estimatedCompletionDate?: Date;
  budgetAllocated?: number;
  budgetSpent?: number;
}

/**
 * Goal - Strategic initiative that contributes to Portfolio Objectives
 * Typically spans 1-3 quarters
 */
export interface Goal {
  id: string;
  portfolioObjectiveId?: string; // Links to parent portfolio objective
  name: string;
  description: string;
  status: 'draft' | 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: Priority;
  owner: string;
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  linkedFeatures: string[]; // Feature IDs
  successCriteria: string[];
  metrics: GoalMetrics;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMetrics {
  totalFeatures: number;
  completedFeatures: number;
  progressPercentage: number;
  blockers: number;
  estimatedCompletionDate?: Date;
}

/**
 * Feature - Large body of work that delivers business value
 * Typically spans 1-3 sprints and contains multiple epics
 */
export interface Feature {
  id: string;
  goalId?: string; // Links to parent goal
  name: string;
  description: string;
  status: 'backlog' | 'planned' | 'in-progress' | 'testing' | 'done' | 'cancelled';
  priority: Priority;
  owner: string;
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  linkedEpics: string[]; // Epic IDs
  acceptanceCriteria: string[];
  businessValue: number; // 1-100 scale
  effort: number; // Story points or effort estimate
  testCoverageTarget?: number; // Percentage
  metrics: FeatureMetrics;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureMetrics {
  totalEpics: number;
  completedEpics: number;
  totalStories: number;
  completedStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  progressPercentage: number;
  testCoveragePercentage: number;
  blockers: number;
}

/**
 * Epic - Collection of related user stories
 * Typically delivered within 1-2 sprints
 */
export interface Epic {
  id: string;
  featureId?: string; // Links to parent feature
  boardId: string; // Links to agile board
  name: string;
  description: string;
  status: 'backlog' | 'planned' | 'in-progress' | 'testing' | 'done' | 'cancelled';
  priority: Priority;
  owner: string;
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  linkedStories: string[]; // Story IDs
  acceptanceCriteria: string[];
  estimate: number; // Total story points
  metrics: EpicMetrics;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EpicMetrics {
  totalStories: number;
  completedStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  progressPercentage: number;
  testCoveragePercentage: number;
  blockers: number;
}

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
  capacity?: number; // Team capacity in story points
  createdAt: Date;
}

export interface Story {
  id: string;
  boardId: string;
  sprintId?: string; // null if in backlog
  epicId?: string; // Links to parent epic
  title: string;
  description?: string;
  type: StoryType;
  status: StoryStatus;
  priority: Priority;
  estimate?: number; // Story points
  assignee?: string;
  reporter: string;
  tags: string[];
  acceptanceCriteria: string[]; // Added for consistency
  tasks: Task[];
  testLinks: TestLink[];
  repositoryLinks: RepositoryLink[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
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
  portfolioObjectives: PortfolioObjective[];
  goals: Goal[];
  features: Feature[];
  epics: Epic[];
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

/**
 * Agile Hierarchy View - Provides full traceability from Portfolio to Task
 */
export interface AgileHierarchyView {
  portfolioObjective?: PortfolioObjective;
  goal?: Goal;
  feature?: Feature;
  epic?: Epic;
  story: Story;
  tasks: Task[];
  tests: TestLink[];
}

/**
 * Filter for querying agile hierarchy items
 */
export interface AgileHierarchyFilter {
  portfolioObjectiveId?: string;
  goalId?: string;
  featureId?: string;
  epicId?: string;
  storyId?: string;
  status?: string[];
  priority?: Priority[];
  owner?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  targetDateFrom?: Date;
  targetDateTo?: Date;
  tags?: string[];
}

/**
 * Complete agile metrics across all hierarchy levels
 */
export interface CompleteAgileMetrics {
  portfolio: {
    totalObjectives: number;
    activeObjectives: number;
    completedObjectives: number;
    averageProgress: number;
  };
  goals: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    averageProgress: number;
  };
  features: {
    totalFeatures: number;
    activeFeatures: number;
    completedFeatures: number;
    averageProgress: number;
    averageTestCoverage: number;
  };
  epics: {
    totalEpics: number;
    activeEpics: number;
    completedEpics: number;
    averageProgress: number;
  };
  stories: {
    totalStories: number;
    activeStories: number;
    completedStories: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
  };
}

// ========================================
// User Administration Types
// ========================================

/**
 * Role types for module-level access control
 */
export type UserRole = 'read' | 'user' | 'admin';

/**
 * Module names that can have role-based access
 */
export type ModuleName = 
  | 'test-registry'
  | 'test-executor'
  | 'code-tracer'
  | 'issue-manager'
  | 'defect-manager'
  | 'dashboard-reporter'
  | 'agile'
  | 'gitops'
  | 'user-admin';

/**
 * Module-level permissions
 */
export interface ModulePermission {
  moduleName: ModuleName;
  role: UserRole;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean; // For admin functions like user assignment
}

/**
 * User account with module-level permissions
 */
export interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'admin' | 'user'; // System-wide role
  modulePermissions: Map<ModuleName, UserRole>; // Per-module roles
  createdDate: Date;
  lastLogin?: Date;
  lastModified: Date;
  modifiedBy: string;
}

/**
 * User session for tracking logins
 */
export interface UserSession {
  id: string;
  userId: string;
  email: string;
  loginTime: Date;
  lastActivityTime: Date;
  logoutTime?: Date;
  ipAddress?: string;
  userAgent?: string;
  active: boolean;
}

/**
 * User audit log entry
 */
export interface UserAuditLog {
  id: string;
  userId: string;
  action: string;
  moduleName: ModuleName;
  resourceId?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Filter for user queries
 */
export interface UserFilter {
  status?: User['status'][];
  role?: User['role'][];
  moduleName?: ModuleName;
  moduleRole?: UserRole;
}

/**
 * User management metrics
 */
export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentLogins: number;
  moduleAccessBreakdown: Record<ModuleName, Record<UserRole, number>>;
}
