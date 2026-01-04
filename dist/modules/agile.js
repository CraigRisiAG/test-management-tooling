"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgileModule = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const gitops_1 = require("./gitops");
class AgileModule {
    static configPath = '.zebrunner/agile.json';
    static config = null;
    /**
     * Initialize agile board configuration
     */
    static async init(projectPath = process.cwd()) {
        const configDir = path.join(projectPath, '.zebrunner');
        const configFile = path.join(projectPath, this.configPath);
        try {
            await fs.mkdir(configDir, { recursive: true });
            const defaultConfig = {
                enabled: true,
                boards: [],
                gitOpsIntegration: true,
                autoLinkTests: true,
                autoLinkCommits: true,
                notificationSettings: {
                    sprintStartReminder: true,
                    sprintEndReminder: true,
                    storyAssigned: true,
                    testFailures: true,
                },
            };
            await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2));
            this.config = defaultConfig;
            logger_1.Logger.success('Agile board configuration initialized');
        }
        catch (error) {
            logger_1.Logger.error(`Failed to initialize agile config: ${error.message}`);
            throw error;
        }
    }
    /**
     * Load agile board configuration
     */
    static async loadConfig(projectPath = process.cwd()) {
        if (this.config)
            return this.config;
        const configFile = path.join(projectPath, this.configPath);
        try {
            const data = await fs.readFile(configFile, 'utf-8');
            this.config = JSON.parse(data);
            return this.config;
        }
        catch (error) {
            logger_1.Logger.warn('Agile config not found, initializing...');
            await this.init(projectPath);
            return this.config;
        }
    }
    /**
     * Save agile board configuration
     */
    static async saveConfig(projectPath = process.cwd()) {
        if (!this.config) {
            throw new Error('No configuration to save');
        }
        const configFile = path.join(projectPath, this.configPath);
        try {
            await fs.writeFile(configFile, JSON.stringify(this.config, null, 2));
            logger_1.Logger.success('Agile configuration saved');
        }
        catch (error) {
            logger_1.Logger.error(`Failed to save config: ${error.message}`);
            throw error;
        }
    }
    /**
     * Create a new agile board
     */
    static async createBoard(name, options = {}) {
        const config = await this.loadConfig(options.projectPath);
        const defaultColumns = [
            { id: '1', name: 'Backlog', status: 'backlog', position: 0 },
            { id: '2', name: 'To Do', status: 'todo', position: 1 },
            { id: '3', name: 'In Progress', status: 'in-progress', wipLimit: 5, position: 2 },
            { id: '4', name: 'Review', status: 'review', wipLimit: 3, position: 3 },
            { id: '5', name: 'Testing', status: 'testing', position: 4 },
            { id: '6', name: 'Done', status: 'done', position: 5 },
        ];
        const settings = {
            sprintDurationWeeks: options.sprintDurationWeeks || 2,
            storyPointScale: options.storyPointScale || [1, 2, 3, 5, 8, 13, 21],
            columns: defaultColumns,
            autoArchiveSprints: true,
            requireEstimates: false,
        };
        const board = {
            id: Date.now().toString(),
            name,
            description: options.description,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            sprints: [],
            backlog: [],
            settings,
        };
        config.boards.push(board);
        if (!config.defaultBoard) {
            config.defaultBoard = board.id;
        }
        this.config = config;
        await this.saveConfig(options.projectPath);
        logger_1.Logger.success(`Board "${name}" created with ID: ${board.id}`);
        return board;
    }
    /**
     * Get all boards or specific board by ID
     */
    static async getBoards(boardId, projectPath) {
        const config = await this.loadConfig(projectPath);
        if (boardId) {
            const board = config.boards.find((b) => b.id === boardId);
            return board ? [board] : [];
        }
        return config.boards;
    }
    /**
     * Update board settings
     */
    static async updateBoardSettings(boardId, settings, projectPath) {
        const config = await this.loadConfig(projectPath);
        const board = config.boards.find((b) => b.id === boardId);
        if (!board) {
            throw new Error(`Board ${boardId} not found`);
        }
        board.settings = { ...board.settings, ...settings };
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(projectPath);
        logger_1.Logger.success('Board settings updated');
    }
    /**
     * Create a new sprint
     */
    static async createSprint(boardId, name, options = {}) {
        const config = await this.loadConfig(options.projectPath);
        const board = config.boards.find((b) => b.id === boardId);
        if (!board) {
            throw new Error(`Board ${boardId} not found`);
        }
        const startDate = options.startDate || new Date();
        const endDate = options.endDate ||
            new Date(startDate.getTime() + board.settings.sprintDurationWeeks * 7 * 24 * 60 * 60 * 1000);
        const sprint = {
            id: Date.now().toString(),
            boardId,
            name,
            goal: options.goal,
            status: 'planning',
            startDate,
            endDate,
            stories: [],
            createdAt: new Date(),
        };
        board.sprints.push(sprint);
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(options.projectPath);
        logger_1.Logger.success(`Sprint "${name}" created with ID: ${sprint.id}`);
        return sprint;
    }
    /**
     * Start a sprint
     */
    static async startSprint(sprintId, projectPath) {
        const config = await this.loadConfig(projectPath);
        let sprint;
        let board;
        for (const b of config.boards) {
            const s = b.sprints.find((s) => s.id === sprintId);
            if (s) {
                sprint = s;
                board = b;
                break;
            }
        }
        if (!sprint || !board) {
            throw new Error(`Sprint ${sprintId} not found`);
        }
        // Check if there's already an active sprint
        const activeSprint = board.sprints.find((s) => s.status === 'active');
        if (activeSprint) {
            throw new Error(`Cannot start sprint. Sprint "${activeSprint.name}" is already active. Complete it first.`);
        }
        sprint.status = 'active';
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(projectPath);
        logger_1.Logger.success(`Sprint "${sprint.name}" started`);
    }
    /**
     * Complete a sprint
     */
    static async completeSprint(sprintId, projectPath) {
        const config = await this.loadConfig(projectPath);
        let sprint;
        let board;
        for (const b of config.boards) {
            const s = b.sprints.find((s) => s.id === sprintId);
            if (s) {
                sprint = s;
                board = b;
                break;
            }
        }
        if (!sprint || !board) {
            throw new Error(`Sprint ${sprintId} not found`);
        }
        sprint.status = 'completed';
        // Calculate velocity
        const completedStories = sprint.stories.filter((s) => s.status === 'done');
        const completedPoints = completedStories.reduce((sum, s) => sum + (s.estimate || 0), 0);
        sprint.velocity = completedPoints;
        // Move incomplete stories back to backlog
        const incompleteStories = sprint.stories.filter((s) => s.status !== 'done');
        incompleteStories.forEach((story) => {
            story.sprintId = undefined;
            story.status = 'backlog';
            board.backlog.push(story);
        });
        sprint.stories = completedStories;
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(projectPath);
        const metrics = await this.getSprintMetrics(sprintId, projectPath);
        logger_1.Logger.success(`Sprint "${sprint.name}" completed with velocity: ${completedPoints}`);
        return metrics;
    }
    /**
     * Create a new story
     */
    static async createStory(boardId, title, options = {}) {
        const config = await this.loadConfig(options.projectPath);
        const board = config.boards.find((b) => b.id === boardId);
        if (!board) {
            throw new Error(`Board ${boardId} not found`);
        }
        const story = {
            id: Date.now().toString(),
            boardId,
            sprintId: options.sprintId,
            title,
            description: options.description,
            type: options.type || 'feature',
            status: options.sprintId ? 'todo' : 'backlog',
            priority: options.priority || 'medium',
            estimate: options.estimate,
            assignee: options.assignee,
            reporter: options.reporter || 'system',
            tags: options.tags || [],
            tasks: [],
            testLinks: [],
            repositoryLinks: [],
            comments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (options.sprintId) {
            const sprint = board.sprints.find((s) => s.id === options.sprintId);
            if (sprint) {
                sprint.stories.push(story);
            }
            else {
                throw new Error(`Sprint ${options.sprintId} not found`);
            }
        }
        else {
            board.backlog.push(story);
        }
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(options.projectPath);
        logger_1.Logger.success(`Story "${title}" created with ID: ${story.id}`);
        return story;
    }
    /**
     * Update story status
     */
    static async updateStoryStatus(storyId, status, projectPath) {
        const config = await this.loadConfig(projectPath);
        let story;
        let board;
        for (const b of config.boards) {
            // Check backlog
            story = b.backlog.find((s) => s.id === storyId);
            if (story) {
                board = b;
                break;
            }
            // Check sprints
            for (const sprint of b.sprints) {
                story = sprint.stories.find((s) => s.id === storyId);
                if (story) {
                    board = b;
                    break;
                }
            }
            if (story)
                break;
        }
        if (!story || !board) {
            throw new Error(`Story ${storyId} not found`);
        }
        story.status = status;
        story.updatedAt = new Date();
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(projectPath);
        logger_1.Logger.success(`Story status updated to: ${status}`);
    }
    /**
     * Move story to sprint
     */
    static async moveStoryToSprint(storyId, sprintId, projectPath) {
        const config = await this.loadConfig(projectPath);
        let story;
        let board;
        for (const b of config.boards) {
            story = b.backlog.find((s) => s.id === storyId);
            if (story) {
                board = b;
                break;
            }
        }
        if (!story || !board) {
            throw new Error(`Story ${storyId} not found in backlog`);
        }
        const sprint = board.sprints.find((s) => s.id === sprintId);
        if (!sprint) {
            throw new Error(`Sprint ${sprintId} not found`);
        }
        // Remove from backlog
        board.backlog = board.backlog.filter((s) => s.id !== storyId);
        // Add to sprint
        story.sprintId = sprintId;
        story.status = story.status === 'backlog' ? 'todo' : story.status;
        sprint.stories.push(story);
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(projectPath);
        logger_1.Logger.success(`Story moved to sprint: ${sprint.name}`);
    }
    /**
     * Link test to story
     */
    static async linkTest(storyId, testPath, options = {}) {
        const config = await this.loadConfig(options.projectPath);
        let story;
        let board;
        for (const b of config.boards) {
            // Check backlog
            story = b.backlog.find((s) => s.id === storyId);
            if (story) {
                board = b;
                break;
            }
            // Check sprints
            for (const sprint of b.sprints) {
                story = sprint.stories.find((s) => s.id === storyId);
                if (story) {
                    board = b;
                    break;
                }
            }
            if (story)
                break;
        }
        if (!story || !board) {
            throw new Error(`Story ${storyId} not found`);
        }
        const testLink = {
            id: Date.now().toString(),
            storyId,
            testId: options.testId || `test-${Date.now()}`,
            testName: options.testName || path.basename(testPath),
            testType: options.testType || 'unit',
            testPath,
            status: 'passing',
            linkedAt: new Date(),
        };
        story.testLinks.push(testLink);
        story.updatedAt = new Date();
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(options.projectPath);
        logger_1.Logger.success(`Test linked to story: ${testLink.testName}`);
        return testLink;
    }
    /**
     * Link repository commits to story
     */
    static async linkRepository(storyId, repositoryUrl, options = {}) {
        const config = await this.loadConfig(options.projectPath);
        let story;
        let board;
        for (const b of config.boards) {
            // Check backlog
            story = b.backlog.find((s) => s.id === storyId);
            if (story) {
                board = b;
                break;
            }
            // Check sprints
            for (const sprint of b.sprints) {
                story = sprint.stories.find((s) => s.id === storyId);
                if (story) {
                    board = b;
                    break;
                }
            }
            if (story)
                break;
        }
        if (!story || !board) {
            throw new Error(`Story ${storyId} not found`);
        }
        let commits = options.commits || [];
        let filePaths = options.filePaths || [];
        // Auto-detect commits mentioning story ID
        if (options.autoDetect && config.gitOpsIntegration) {
            try {
                const history = await gitops_1.GitOpsModule.getCommitHistory(options.projectPath || process.cwd(), 100);
                // Find commits mentioning the story ID
                const relevantCommits = history.filter((commit) => commit.message.includes(storyId) ||
                    commit.message.includes(`#${storyId}`) ||
                    commit.message.toLowerCase().includes(story.title.toLowerCase()));
                commits = relevantCommits.map((c) => c.hash);
                // Collect file paths from commits
                const allFiles = new Set();
                relevantCommits.forEach((commit) => {
                    commit.files.forEach((file) => allFiles.add(file));
                });
                filePaths = Array.from(allFiles);
                logger_1.Logger.info(`Auto-detected ${commits.length} commits for story`);
            }
            catch (error) {
                logger_1.Logger.warn(`Could not auto-detect commits: ${error.message}`);
            }
        }
        const repoLink = {
            id: Date.now().toString(),
            storyId,
            repositoryUrl,
            branch: options.branch,
            commits,
            filePaths,
            linkedAt: new Date(),
        };
        story.repositoryLinks.push(repoLink);
        story.updatedAt = new Date();
        board.updatedAt = new Date();
        this.config = config;
        await this.saveConfig(options.projectPath);
        logger_1.Logger.success(`Repository linked with ${commits.length} commits`);
        return repoLink;
    }
    /**
     * Get sprint metrics including burndown
     */
    static async getSprintMetrics(sprintId, projectPath) {
        const config = await this.loadConfig(projectPath);
        let sprint;
        for (const board of config.boards) {
            sprint = board.sprints.find((s) => s.id === sprintId);
            if (sprint)
                break;
        }
        if (!sprint) {
            throw new Error(`Sprint ${sprintId} not found`);
        }
        const totalStories = sprint.stories.length;
        const completedStories = sprint.stories.filter((s) => s.status === 'done').length;
        const totalPoints = sprint.stories.reduce((sum, s) => sum + (s.estimate || 0), 0);
        const completedPoints = sprint.stories
            .filter((s) => s.status === 'done')
            .reduce((sum, s) => sum + (s.estimate || 0), 0);
        // Calculate burndown data
        const burndownData = [];
        const sprintDays = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
        for (let day = 0; day <= sprintDays; day++) {
            const date = new Date(sprint.startDate.getTime() + day * 24 * 60 * 60 * 1000);
            const idealRemaining = totalPoints - (totalPoints / sprintDays) * day;
            // For actual, would need historical data - using current for now
            const remainingPoints = totalPoints - completedPoints;
            burndownData.push({
                date,
                remainingPoints,
                idealRemaining: Math.max(0, idealRemaining),
            });
        }
        // Calculate test coverage
        const totalTests = sprint.stories.reduce((sum, s) => sum + s.testLinks.length, 0);
        const passingTests = sprint.stories.reduce((sum, s) => sum + s.testLinks.filter((t) => t.status === 'passing').length, 0);
        const testCoverage = totalTests > 0 ? (passingTests / totalTests) * 100 : 0;
        return {
            sprintId,
            totalStories,
            completedStories,
            totalPoints,
            completedPoints,
            velocity: sprint.velocity || completedPoints,
            burndownData,
            testCoverage,
        };
    }
    /**
     * Get board metrics
     */
    static async getBoardMetrics(boardId, projectPath) {
        const config = await this.loadConfig(projectPath);
        const board = config.boards.find((b) => b.id === boardId);
        if (!board) {
            throw new Error(`Board ${boardId} not found`);
        }
        // Collect all stories
        const allStories = [...board.backlog];
        board.sprints.forEach((sprint) => allStories.push(...sprint.stories));
        // Count by status
        const storiesByStatus = {
            backlog: 0,
            todo: 0,
            'in-progress': 0,
            review: 0,
            testing: 0,
            done: 0,
        };
        allStories.forEach((story) => {
            storiesByStatus[story.status]++;
        });
        // Count by priority
        const storiesByPriority = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
        };
        allStories.forEach((story) => {
            storiesByPriority[story.priority]++;
        });
        // Calculate average velocity
        const completedSprints = board.sprints.filter((s) => s.status === 'completed');
        const totalVelocity = completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0);
        const averageVelocity = completedSprints.length > 0 ? totalVelocity / completedSprints.length : 0;
        // Calculate average cycle time (todo to done)
        const doneStories = allStories.filter((s) => s.status === 'done');
        let totalCycleTime = 0;
        doneStories.forEach((story) => {
            const cycleTime = (story.updatedAt.getTime() - story.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            totalCycleTime += cycleTime;
        });
        const averageCycleTime = doneStories.length > 0 ? totalCycleTime / doneStories.length : 0;
        // Calculate test coverage
        const totalTests = allStories.reduce((sum, s) => sum + s.testLinks.length, 0);
        const passingTests = allStories.reduce((sum, s) => sum + s.testLinks.filter((t) => t.status === 'passing').length, 0);
        const testCoveragePercentage = totalTests > 0 ? (passingTests / totalTests) * 100 : 0;
        return {
            boardId,
            totalStories: allStories.length,
            storiesByStatus,
            storiesByPriority,
            averageVelocity,
            averageCycleTime,
            testCoveragePercentage,
            completedSprints: completedSprints.length,
        };
    }
    /**
     * Display board summary
     */
    static async displayBoardSummary(boardId, projectPath) {
        const boards = await this.getBoards(boardId, projectPath);
        if (boards.length === 0) {
            logger_1.Logger.warn('No boards found');
            return;
        }
        for (const board of boards) {
            logger_1.Logger.info(`\n📊 Board: ${board.name} (${board.status})`);
            if (board.description) {
                logger_1.Logger.info(`   ${board.description}`);
            }
            logger_1.Logger.info(`\n   Sprints: ${board.sprints.length}`);
            board.sprints.slice(0, 3).forEach((sprint) => {
                logger_1.Logger.info(`   • ${sprint.name} (${sprint.status}) - ${sprint.stories.length} stories`);
            });
            logger_1.Logger.info(`\n   Backlog: ${board.backlog.length} stories`);
            const metrics = await this.getBoardMetrics(board.id, projectPath);
            logger_1.Logger.info(`\n   Metrics:`);
            logger_1.Logger.info(`   • Average Velocity: ${metrics.averageVelocity.toFixed(1)} points/sprint`);
            logger_1.Logger.info(`   • Average Cycle Time: ${metrics.averageCycleTime.toFixed(1)} days`);
            logger_1.Logger.info(`   • Test Coverage: ${metrics.testCoveragePercentage.toFixed(1)}%`);
            logger_1.Logger.info(`   • Completed Sprints: ${metrics.completedSprints}`);
        }
    }
    /**
     * Display sprint summary
     */
    static async displaySprintSummary(sprintId, projectPath) {
        const config = await this.loadConfig(projectPath);
        let sprint;
        let board;
        for (const b of config.boards) {
            const s = b.sprints.find((s) => s.id === sprintId);
            if (s) {
                sprint = s;
                board = b;
                break;
            }
        }
        if (!sprint || !board) {
            logger_1.Logger.error(`Sprint ${sprintId} not found`);
            return;
        }
        const metrics = await this.getSprintMetrics(sprintId, projectPath);
        logger_1.Logger.info(`\n🎯 Sprint: ${sprint.name} (${sprint.status})`);
        if (sprint.goal) {
            logger_1.Logger.info(`   Goal: ${sprint.goal}`);
        }
        logger_1.Logger.info(`   Duration: ${sprint.startDate.toLocaleDateString()} - ${sprint.endDate.toLocaleDateString()}`);
        logger_1.Logger.info(`\n   Progress:`);
        logger_1.Logger.info(`   • Stories: ${metrics.completedStories}/${metrics.totalStories} completed`);
        logger_1.Logger.info(`   • Points: ${metrics.completedPoints}/${metrics.totalPoints} completed`);
        logger_1.Logger.info(`   • Velocity: ${metrics.velocity} points`);
        logger_1.Logger.info(`   • Test Coverage: ${metrics.testCoverage.toFixed(1)}%`);
        logger_1.Logger.info(`\n   Stories:`);
        sprint.stories.slice(0, 5).forEach((story) => {
            const icon = story.status === 'done' ? '✅' : story.status === 'in-progress' ? '🔄' : '📋';
            logger_1.Logger.info(`   ${icon} ${story.title} (${story.status}) - ${story.estimate || '?'} pts`);
        });
        if (sprint.stories.length > 5) {
            logger_1.Logger.info(`   ... and ${sprint.stories.length - 5} more`);
        }
    }
}
exports.AgileModule = AgileModule;
//# sourceMappingURL=agile.js.map