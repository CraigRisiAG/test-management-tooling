/**
 * Agile Board Module
 *
 * Provides comprehensive agile board functionality including:
 * - Board and sprint management
 * - Story and task tracking
 * - Test linkage with coverage tracking
 * - Repository integration via GitOps
 * - Sprint metrics and burndown charts
 * - Backlog management
 */
import type { AgileBoard, BoardSettings, Sprint, Story, TestLink, RepositoryLink, SprintMetrics, BoardMetrics, AgileBoardConfig, StoryStatus, Priority, StoryType } from '../types';
export declare class AgileModule {
    private static configPath;
    private static config;
    /**
     * Initialize agile board configuration
     */
    static init(projectPath?: string): Promise<void>;
    /**
     * Load agile board configuration
     */
    static loadConfig(projectPath?: string): Promise<AgileBoardConfig>;
    /**
     * Save agile board configuration
     */
    static saveConfig(projectPath?: string): Promise<void>;
    /**
     * Create a new agile board
     */
    static createBoard(name: string, options?: {
        description?: string;
        sprintDurationWeeks?: number;
        storyPointScale?: number[];
        projectPath?: string;
    }): Promise<AgileBoard>;
    /**
     * Get all boards or specific board by ID
     */
    static getBoards(boardId?: string, projectPath?: string): Promise<AgileBoard[]>;
    /**
     * Update board settings
     */
    static updateBoardSettings(boardId: string, settings: Partial<BoardSettings>, projectPath?: string): Promise<void>;
    /**
     * Create a new sprint
     */
    static createSprint(boardId: string, name: string, options?: {
        goal?: string;
        startDate?: Date;
        endDate?: Date;
        projectPath?: string;
    }): Promise<Sprint>;
    /**
     * Start a sprint
     */
    static startSprint(sprintId: string, projectPath?: string): Promise<void>;
    /**
     * Complete a sprint
     */
    static completeSprint(sprintId: string, projectPath?: string): Promise<SprintMetrics>;
    /**
     * Create a new story
     */
    static createStory(boardId: string, title: string, options?: {
        description?: string;
        type?: StoryType;
        priority?: Priority;
        estimate?: number;
        assignee?: string;
        reporter?: string;
        tags?: string[];
        sprintId?: string;
        projectPath?: string;
    }): Promise<Story>;
    /**
     * Update story status
     */
    static updateStoryStatus(storyId: string, status: StoryStatus, projectPath?: string): Promise<void>;
    /**
     * Move story to sprint
     */
    static moveStoryToSprint(storyId: string, sprintId: string, projectPath?: string): Promise<void>;
    /**
     * Link test to story
     */
    static linkTest(storyId: string, testPath: string, options?: {
        testName?: string;
        testType?: 'unit' | 'integration' | 'e2e' | 'performance';
        testId?: string;
        projectPath?: string;
    }): Promise<TestLink>;
    /**
     * Link repository commits to story
     */
    static linkRepository(storyId: string, repositoryUrl: string, options?: {
        branch?: string;
        commits?: string[];
        filePaths?: string[];
        autoDetect?: boolean;
        projectPath?: string;
    }): Promise<RepositoryLink>;
    /**
     * Get sprint metrics including burndown
     */
    static getSprintMetrics(sprintId: string, projectPath?: string): Promise<SprintMetrics>;
    /**
     * Get board metrics
     */
    static getBoardMetrics(boardId: string, projectPath?: string): Promise<BoardMetrics>;
    /**
     * Display board summary
     */
    static displayBoardSummary(boardId: string, projectPath?: string): Promise<void>;
    /**
     * Display sprint summary
     */
    static displaySprintSummary(sprintId: string, projectPath?: string): Promise<void>;
}
//# sourceMappingURL=agile.d.ts.map