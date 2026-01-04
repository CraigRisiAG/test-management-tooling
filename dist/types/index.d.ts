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
    syncInterval?: number;
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
    storyPointScale: number[];
    columns: BoardColumn[];
    autoArchiveSprints: boolean;
    requireEstimates: boolean;
}
export interface BoardColumn {
    id: string;
    name: string;
    status: StoryStatus;
    wipLimit?: number;
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
    velocity?: number;
    createdAt: Date;
}
export interface Story {
    id: string;
    boardId: string;
    sprintId?: string;
    title: string;
    description?: string;
    type: StoryType;
    status: StoryStatus;
    priority: Priority;
    estimate?: number;
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
    testPath: string;
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
    commits: string[];
    filePaths: string[];
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
    averageCycleTime: number;
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
//# sourceMappingURL=index.d.ts.map