/**
 * @file agile-hierarchy.ts
 * @description Manages agile hierarchy: Portfolio → Goals → Features → Epics → Stories
 * 
 * Hierarchy Structure:
 * Portfolio Objectives (Business Strategy, Multi-year)
 *   └── Goals (Strategic Initiatives, 1-3 quarters)
 *       └── Features (Large deliverables, 1-3 sprints)
 *           └── Epics (Story collections, 1-2 sprints)
 *               └── Stories (User stories, 1-2 weeks)
 *                   └── Tasks (Implementation tasks, hours/days)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/logger';
import type {
  PortfolioObjective,
  Goal,
  Feature,
  Epic,
  Story,
  AgileHierarchyView,
  AgileHierarchyFilter,
  CompleteAgileMetrics,
  Priority,
} from '../types';

export class AgileHierarchyModule {
  private static dataPath = '.testmgr/agile-hierarchy.json';
  private static data: {
    portfolios: PortfolioObjective[];
    goals: Goal[];
    features: Feature[];
    epics: Epic[];
  } | null = null;

  /**
   * Initialize agile hierarchy data structure
   */
  static async init(projectPath: string = process.cwd()): Promise<void> {
    const configDir = path.join(projectPath, '.testmgr');
    const dataFile = path.join(projectPath, this.dataPath);

    try {
      await fs.mkdir(configDir, { recursive: true });

      const defaultData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2));
      this.data = defaultData;
      Logger.success('Agile hierarchy initialized');
    } catch (error) {
      Logger.error(`Failed to initialize agile hierarchy: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Load agile hierarchy data
   */
  static async loadData(projectPath: string = process.cwd()): Promise<typeof this.data> {
    if (this.data) return this.data;

    const dataFile = path.join(projectPath, this.dataPath);

    try {
      const content = await fs.readFile(dataFile, 'utf-8');
      this.data = JSON.parse(content);
      return this.data;
    } catch (error) {
      Logger.warn('Agile hierarchy data not found, initializing...');
      await this.init(projectPath);
      return this.data;
    }
  }

  /**
   * Save agile hierarchy data
   */
  private static async saveData(projectPath: string = process.cwd()): Promise<void> {
    if (!this.data) {
      throw new Error('No data to save');
    }

    const dataFile = path.join(projectPath, this.dataPath);
    await fs.writeFile(dataFile, JSON.stringify(this.data, null, 2));
  }

  // ==================== Portfolio Objective Management ====================

  /**
   * Create a new portfolio objective
   */
  static async createPortfolio(
    portfolio: Omit<PortfolioObjective, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PortfolioObjective> {
    await this.loadData();

    const newPortfolio: PortfolioObjective = {
      ...portfolio,
      id: `PORTFOLIO-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.portfolios.push(newPortfolio);
    await this.saveData();

    Logger.success(`Portfolio objective created: ${newPortfolio.name}`);
    return newPortfolio;
  }

  /**
   * Get portfolio objective by ID
   */
  static async getPortfolio(portfolioId: string): Promise<PortfolioObjective | null> {
    await this.loadData();
    return this.data!.portfolios.find((p) => p.id === portfolioId) || null;
  }

  /**
   * List all portfolio objectives
   */
  static async listPortfolios(filter?: { status?: string }): Promise<PortfolioObjective[]> {
    await this.loadData();
    let portfolios = this.data!.portfolios;

    if (filter?.status) {
      portfolios = portfolios.filter((p) => p.status === filter.status);
    }

    return portfolios;
  }

  /**
   * Update portfolio objective
   */
  static async updatePortfolio(
    portfolioId: string,
    updates: Partial<PortfolioObjective>
  ): Promise<PortfolioObjective> {
    await this.loadData();

    const index = this.data!.portfolios.findIndex((p) => p.id === portfolioId);
    if (index === -1) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    const newTimestamp = new Date();
    if (newTimestamp.getTime() <= this.data!.portfolios[index].updatedAt.getTime()) {
      newTimestamp.setTime(this.data!.portfolios[index].updatedAt.getTime() + 1);
    }

    this.data!.portfolios[index] = {
      ...this.data!.portfolios[index],
      ...updates,
      updatedAt: newTimestamp,
    };

    await this.saveData();
    Logger.success(`Portfolio updated: ${portfolioId}`);
    return this.data!.portfolios[index];
  }

  // ==================== Goal Management ====================

  /**
   * Create a new goal
   */
  static async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    await this.loadData();

    const newGoal: Goal = {
      ...goal,
      id: `GOAL-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.goals.push(newGoal);

    // Link to parent portfolio if specified
    if (newGoal.portfolioObjectiveId) {
      const portfolio = await this.getPortfolio(newGoal.portfolioObjectiveId);
      if (portfolio) {
        portfolio.linkedGoals.push(newGoal.id);
        await this.updatePortfolio(portfolio.id, portfolio);
      }
    }

    await this.saveData();
    Logger.success(`Goal created: ${newGoal.name}`);
    return newGoal;
  }

  /**
   * Get goal by ID
   */
  static async getGoal(goalId: string): Promise<Goal | null> {
    await this.loadData();
    return this.data!.goals.find((g) => g.id === goalId) || null;
  }

  /**
   * List goals by portfolio or filter
   */
  static async listGoals(filter?: { portfolioObjectiveId?: string; status?: string }): Promise<Goal[]> {
    await this.loadData();
    let goals = this.data!.goals;

    if (filter?.portfolioObjectiveId) {
      goals = goals.filter((g) => g.portfolioObjectiveId === filter.portfolioObjectiveId);
    }

    if (filter?.status) {
      goals = goals.filter((g) => g.status === filter.status);
    }

    return goals;
  }

  // ==================== Feature Management ====================

  /**
   * Create a new feature
   */
  static async createFeature(feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Promise<Feature> {
    await this.loadData();

    const newFeature: Feature = {
      ...feature,
      id: `FEATURE-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.features.push(newFeature);

    // Link to parent goal if specified
    if (newFeature.goalId) {
      const goal = await this.getGoal(newFeature.goalId);
      if (goal) {
        goal.linkedFeatures.push(newFeature.id);
        await this.updateGoal(goal.id, goal);
      }
    }

    await this.saveData();
    Logger.success(`Feature created: ${newFeature.name}`);
    return newFeature;
  }

  /**
   * Get feature by ID
   */
  static async getFeature(featureId: string): Promise<Feature | null> {
    await this.loadData();
    return this.data!.features.find((f) => f.id === featureId) || null;
  }

  /**
   * List features by goal or filter
   */
  static async listFeatures(filter?: { goalId?: string; status?: string }): Promise<Feature[]> {
    await this.loadData();
    let features = this.data!.features;

    if (filter?.goalId) {
      features = features.filter((f) => f.goalId === filter.goalId);
    }

    if (filter?.status) {
      features = features.filter((f) => f.status === filter.status);
    }

    return features;
  }

  // ==================== Epic Management ====================

  /**
   * Create a new epic
   */
  static async createEpic(epic: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>): Promise<Epic> {
    await this.loadData();

    const newEpic: Epic = {
      ...epic,
      id: `EPIC-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.epics.push(newEpic);

    // Link to parent feature if specified
    if (newEpic.featureId) {
      const feature = await this.getFeature(newEpic.featureId);
      if (feature) {
        feature.linkedEpics.push(newEpic.id);
        await this.updateFeature(feature.id, feature);
      }
    }

    await this.saveData();
    Logger.success(`Epic created: ${newEpic.name}`);
    return newEpic;
  }

  /**
   * Get epic by ID
   */
  static async getEpic(epicId: string): Promise<Epic | null> {
    await this.loadData();
    return this.data!.epics.find((e) => e.id === epicId) || null;
  }

  /**
   * List epics by feature or filter
   */
  static async listEpics(filter?: { featureId?: string; boardId?: string; status?: string }): Promise<Epic[]> {
    await this.loadData();
    let epics = this.data!.epics;

    if (filter?.featureId) {
      epics = epics.filter((e) => e.featureId === filter.featureId);
    }

    if (filter?.boardId) {
      epics = epics.filter((e) => e.boardId === filter.boardId);
    }

    if (filter?.status) {
      epics = epics.filter((e) => e.status === filter.status);
    }

    return epics;
  }

  // ==================== Helper Methods ====================

  private static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const index = this.data!.goals.findIndex((g) => g.id === goalId);
    if (index === -1) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    this.data!.goals[index] = {
      ...this.data!.goals[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveData();
    return this.data!.goals[index];
  }

  private static async updateFeature(featureId: string, updates: Partial<Feature>): Promise<Feature> {
    const index = this.data!.features.findIndex((f) => f.id === featureId);
    if (index === -1) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    this.data!.features[index] = {
      ...this.data!.features[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveData();
    return this.data!.features[index];
  }

  /**
   * Get complete hierarchy view for a story
   */
  static async getStoryHierarchy(story: Story): Promise<AgileHierarchyView> {
    const view: AgileHierarchyView = {
      story,
      tasks: story.tasks || [],
      tests: story.testLinks || [],
    };

    if (story.epicId) {
      const epic = await this.getEpic(story.epicId);
      if (epic) {
        view.epic = epic;

        if (epic.featureId) {
          const feature = await this.getFeature(epic.featureId);
          if (feature) {
            view.feature = feature;

            if (feature.goalId) {
              const goal = await this.getGoal(feature.goalId);
              if (goal) {
                view.goal = goal;

                if (goal.portfolioObjectiveId) {
                  const portfolio = await this.getPortfolio(goal.portfolioObjectiveId);
                  if (portfolio) {
                    view.portfolioObjective = portfolio;
                  }
                }
              }
            }
          }
        }
      }
    }

    return view;
  }

  /**
   * Get complete metrics across all hierarchy levels
   */
  static async getCompleteMetrics(): Promise<CompleteAgileMetrics> {
    await this.loadData();

    const portfolios = this.data!.portfolios;
    const goals = this.data!.goals;
    const features = this.data!.features;
    const epics = this.data!.epics;

    return {
      portfolio: {
        totalObjectives: portfolios.length,
        activeObjectives: portfolios.filter((p) => p.status === 'active').length,
        completedObjectives: portfolios.filter((p) => p.status === 'completed').length,
        averageProgress:
          portfolios.reduce((sum, p) => sum + p.metrics.progressPercentage, 0) / portfolios.length || 0,
      },
      goals: {
        totalGoals: goals.length,
        activeGoals: goals.filter((g) => g.status === 'in-progress').length,
        completedGoals: goals.filter((g) => g.status === 'completed').length,
        averageProgress: goals.reduce((sum, g) => sum + g.metrics.progressPercentage, 0) / goals.length || 0,
      },
      features: {
        totalFeatures: features.length,
        activeFeatures: features.filter((f) => f.status === 'in-progress').length,
        completedFeatures: features.filter((f) => f.status === 'done').length,
        averageProgress: features.reduce((sum, f) => sum + f.metrics.progressPercentage, 0) / features.length || 0,
        averageTestCoverage:
          features.reduce((sum, f) => sum + f.metrics.testCoveragePercentage, 0) / features.length || 0,
      },
      epics: {
        totalEpics: epics.length,
        activeEpics: epics.filter((e) => e.status === 'in-progress').length,
        completedEpics: epics.filter((e) => e.status === 'done').length,
        averageProgress: epics.reduce((sum, e) => sum + e.metrics.progressPercentage, 0) / epics.length || 0,
      },
      stories: {
        totalStories: 0, // Would need to integrate with existing story data
        activeStories: 0,
        completedStories: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
      },
    };
  }
}
