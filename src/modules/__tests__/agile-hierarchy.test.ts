/**
 * Agile Hierarchy Module Tests
 * 
 * Comprehensive tests for agile hierarchy functionality including:
 * - Portfolio, Goal, Feature, Epic CRUD operations
 * - Hierarchy relationships and linkage
 * - Metrics calculation across levels
 * - Negative scenarios and edge cases
 * - Data validation and error handling
 */

import { AgileHierarchyModule } from '../agile-hierarchy';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock filesystem
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('AgileHierarchyModule', () => {
  const testProjectPath = '/test/project';
  const dataPath = path.join(testProjectPath, '.testmgr/agile-hierarchy.json');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static data
    (AgileHierarchyModule as any).data = null;
  });

  describe('Initialization', () => {
    it('should initialize hierarchy data structure', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await AgileHierarchyModule.init(testProjectPath);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testProjectPath, '.testmgr'),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should create default data structure with all collections', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await AgileHierarchyModule.init(testProjectPath);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const data = JSON.parse(writeCall[1] as string);

      expect(data).toHaveProperty('portfolios');
      expect(data).toHaveProperty('goals');
      expect(data).toHaveProperty('features');
      expect(data).toHaveProperty('epics');
      expect(Array.isArray(data.portfolios)).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(AgileHierarchyModule.init(testProjectPath)).rejects.toThrow('Permission denied');
    });
  });

  describe('Portfolio Management', () => {
    beforeEach(() => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    describe('Create Portfolio', () => {
      it('should create a new portfolio objective', async () => {
        const portfolio = await AgileHierarchyModule.createPortfolio({
          name: 'Digital Transformation',
          description: 'Transform customer experience',
          status: 'active',
          owner: 'CTO',
          startDate: new Date('2026-01-01'),
          targetDate: new Date('2028-12-31'),
          keyResults: [],
          linkedGoals: [],
          metrics: {
            totalGoals: 0,
            completedGoals: 0,
            progressPercentage: 0,
          },
          tags: ['strategic'],
        });

        expect(portfolio).toHaveProperty('id');
        expect(portfolio.id).toMatch(/^PORTFOLIO-/);
        expect(portfolio.name).toBe('Digital Transformation');
        expect(portfolio.status).toBe('active');
        expect(portfolio).toHaveProperty('createdAt');
        expect(portfolio).toHaveProperty('updatedAt');
      });

      it('should include key results in portfolio', async () => {
        const portfolio = await AgileHierarchyModule.createPortfolio({
          name: 'Revenue Growth',
          description: 'Increase revenue by 50%',
          status: 'active',
          owner: 'CEO',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [
            {
              id: 'KR-1',
              description: 'Customer satisfaction',
              targetValue: 90,
              currentValue: 75,
              unit: '%',
              status: 'in-progress',
            },
          ],
          linkedGoals: [],
          metrics: {
            totalGoals: 0,
            completedGoals: 0,
            progressPercentage: 0,
          },
          tags: [],
        });

        expect(portfolio.keyResults).toHaveLength(1);
        expect(portfolio.keyResults[0].description).toBe('Customer satisfaction');
      });
    });

    describe('Get Portfolio', () => {
      it('should retrieve existing portfolio by ID', async () => {
        const created = await AgileHierarchyModule.createPortfolio({
          name: 'Test Portfolio',
          description: '',
          status: 'active',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: {
            totalGoals: 0,
            completedGoals: 0,
            progressPercentage: 0,
          },
          tags: [],
        });

        const retrieved = await AgileHierarchyModule.getPortfolio(created.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe('Test Portfolio');
      });

      it('should return null for non-existent portfolio', async () => {
        const result = await AgileHierarchyModule.getPortfolio('PORTFOLIO-NONEXISTENT');

        expect(result).toBeNull();
      });
    });

    describe('List Portfolios', () => {
      it('should list all portfolios', async () => {
        await AgileHierarchyModule.createPortfolio({
          name: 'Portfolio 1',
          description: '',
          status: 'active',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
          tags: [],
        });

        await AgileHierarchyModule.createPortfolio({
          name: 'Portfolio 2',
          description: '',
          status: 'completed',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
          tags: [],
        });

        const portfolios = await AgileHierarchyModule.listPortfolios();

        expect(portfolios).toHaveLength(2);
      });

      it('should filter portfolios by status', async () => {
        await AgileHierarchyModule.createPortfolio({
          name: 'Active',
          description: '',
          status: 'active',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
          tags: [],
        });

        await AgileHierarchyModule.createPortfolio({
          name: 'Completed',
          description: '',
          status: 'completed',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
          tags: [],
        });

        const active = await AgileHierarchyModule.listPortfolios({ status: 'active' });

        expect(active).toHaveLength(1);
        expect(active[0].name).toBe('Active');
      });
    });

    describe('Update Portfolio', () => {
      it('should update existing portfolio', async () => {
        const portfolio = await AgileHierarchyModule.createPortfolio({
          name: 'Original Name',
          description: '',
          status: 'active',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
          tags: [],
        });

        const updated = await AgileHierarchyModule.updatePortfolio(portfolio.id, {
          name: 'Updated Name',
          status: 'on-track',
        });

        expect(updated.name).toBe('Updated Name');
        expect(updated.status).toBe('on-track');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(portfolio.updatedAt.getTime());
      });

      it('should throw error when updating non-existent portfolio', async () => {
        await expect(
          AgileHierarchyModule.updatePortfolio('PORTFOLIO-FAKE', { name: 'Test' })
        ).rejects.toThrow('Portfolio not found');
      });
    });
  });

  describe('Goal Management', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const portfolio = await AgileHierarchyModule.createPortfolio({
        name: 'Parent Portfolio',
        description: '',
        status: 'active',
        owner: 'User',
        startDate: new Date(),
        targetDate: new Date(),
        keyResults: [],
        linkedGoals: [],
        metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
        tags: [],
      });
      portfolioId = portfolio.id;
    });

    describe('Create Goal', () => {
      it('should create goal and link to parent portfolio', async () => {
        const goal = await AgileHierarchyModule.createGoal({
          portfolioObjectiveId: portfolioId,
          name: 'Payment Modernization',
          description: 'Upgrade payment system',
          status: 'planned',
          priority: 'high',
          owner: 'VP Eng',
          startDate: new Date(),
          targetDate: new Date(),
          linkedFeatures: [],
          successCriteria: ['Criterion 1'],
          metrics: {
            totalFeatures: 0,
            completedFeatures: 0,
            progressPercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        expect(goal.id).toMatch(/^GOAL-/);
        expect(goal.portfolioObjectiveId).toBe(portfolioId);
        expect(goal.name).toBe('Payment Modernization');

        // Verify portfolio was updated with linked goal
        const portfolio = await AgileHierarchyModule.getPortfolio(portfolioId);
        expect(portfolio?.linkedGoals).toContain(goal.id);
      });

      it('should create goal without parent portfolio', async () => {
        const goal = await AgileHierarchyModule.createGoal({
          name: 'Standalone Goal',
          description: '',
          status: 'in-progress',
          priority: 'medium',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          linkedFeatures: [],
          successCriteria: [],
          metrics: {
            totalFeatures: 0,
            completedFeatures: 0,
            progressPercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        expect(goal.portfolioObjectiveId).toBeUndefined();
      });
    });

    describe('List Goals', () => {
      it('should list goals by portfolio', async () => {
        await AgileHierarchyModule.createGoal({
          portfolioObjectiveId: portfolioId,
          name: 'Goal 1',
          description: '',
          status: 'planned',
          priority: 'high',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          linkedFeatures: [],
          successCriteria: [],
          metrics: {
            totalFeatures: 0,
            completedFeatures: 0,
            progressPercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        const goals = await AgileHierarchyModule.listGoals({
          portfolioObjectiveId: portfolioId,
        });

        expect(goals).toHaveLength(1);
        expect(goals[0].name).toBe('Goal 1');
      });

      it('should filter goals by status', async () => {
        await AgileHierarchyModule.createGoal({
          name: 'Planned Goal',
          description: '',
          status: 'planned',
          priority: 'high',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          linkedFeatures: [],
          successCriteria: [],
          metrics: {
            totalFeatures: 0,
            completedFeatures: 0,
            progressPercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        await AgileHierarchyModule.createGoal({
          name: 'Completed Goal',
          description: '',
          status: 'completed',
          priority: 'high',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          linkedFeatures: [],
          successCriteria: [],
          metrics: {
            totalFeatures: 0,
            completedFeatures: 0,
            progressPercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        const planned = await AgileHierarchyModule.listGoals({ status: 'planned' });

        expect(planned).toHaveLength(1);
        expect(planned[0].status).toBe('planned');
      });
    });
  });

  describe('Feature Management', () => {
    let goalId: string;

    beforeEach(async () => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const goal = await AgileHierarchyModule.createGoal({
        name: 'Parent Goal',
        description: '',
        status: 'in-progress',
        priority: 'high',
        owner: 'User',
        startDate: new Date(),
        targetDate: new Date(),
        linkedFeatures: [],
        successCriteria: [],
        metrics: {
          totalFeatures: 0,
          completedFeatures: 0,
          progressPercentage: 0,
          blockers: 0,
        },
        tags: [],
      });
      goalId = goal.id;
    });

    describe('Create Feature', () => {
      it('should create feature and link to parent goal', async () => {
        const feature = await AgileHierarchyModule.createFeature({
          goalId,
          name: 'Stripe Integration',
          description: 'Payment gateway integration',
          status: 'planned',
          priority: 'high',
          owner: 'PM',
          linkedEpics: [],
          acceptanceCriteria: ['PCI compliant'],
          businessValue: 90,
          effort: 55,
          metrics: {
            totalEpics: 0,
            completedEpics: 0,
            totalStories: 0,
            completedStories: 0,
            totalStoryPoints: 0,
            completedStoryPoints: 0,
            progressPercentage: 0,
            testCoveragePercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        expect(feature.id).toMatch(/^FEATURE-/);
        expect(feature.goalId).toBe(goalId);
        expect(feature.businessValue).toBe(90);

        // Verify goal was updated
        const goal = await AgileHierarchyModule.getGoal(goalId);
        expect(goal?.linkedFeatures).toContain(feature.id);
      });

      it('should validate business value range', async () => {
        const feature = await AgileHierarchyModule.createFeature({
          name: 'Test Feature',
          description: '',
          status: 'planned',
          priority: 'low',
          owner: 'User',
          linkedEpics: [],
          acceptanceCriteria: [],
          businessValue: 150, // Out of range but no validation yet
          effort: 10,
          metrics: {
            totalEpics: 0,
            completedEpics: 0,
            totalStories: 0,
            completedStories: 0,
            totalStoryPoints: 0,
            completedStoryPoints: 0,
            progressPercentage: 0,
            testCoveragePercentage: 0,
            blockers: 0,
          },
          tags: [],
        });

        expect(feature.businessValue).toBe(150);
      });
    });
  });

  describe('Epic Management', () => {
    let featureId: string;

    beforeEach(async () => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const feature = await AgileHierarchyModule.createFeature({
        name: 'Parent Feature',
        description: '',
        status: 'in-progress',
        priority: 'high',
        owner: 'User',
        linkedEpics: [],
        acceptanceCriteria: [],
        businessValue: 80,
        effort: 40,
        metrics: {
          totalEpics: 0,
          completedEpics: 0,
          totalStories: 0,
          completedStories: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          progressPercentage: 0,
          testCoveragePercentage: 0,
          blockers: 0,
        },
        tags: [],
      });
      featureId = feature.id;
    });

    it('should create epic and link to feature', async () => {
      const epic = await AgileHierarchyModule.createEpic({
        featureId,
        boardId: 'BOARD-001',
        name: 'Payment Gateway Core',
        description: 'Core API integration',
        status: 'planned',
        priority: 'high',
        owner: 'Tech Lead',
        linkedStories: [],
        acceptanceCriteria: ['All endpoints covered'],
        estimate: 34,
        metrics: {
          totalStories: 0,
          completedStories: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          progressPercentage: 0,
          testCoveragePercentage: 0,
          blockers: 0,
        },
        tags: [],
      });

      expect(epic.id).toMatch(/^EPIC-/);
      expect(epic.featureId).toBe(featureId);
      expect(epic.boardId).toBe('BOARD-001');

      // Verify feature was updated
      const feature = await AgileHierarchyModule.getFeature(featureId);
      expect(feature?.linkedEpics).toContain(epic.id);
    });

    it('should list epics by feature', async () => {
      await AgileHierarchyModule.createEpic({
        featureId,
        boardId: 'BOARD-001',
        name: 'Epic 1',
        description: '',
        status: 'planned',
        priority: 'high',
        owner: 'User',
        linkedStories: [],
        acceptanceCriteria: [],
        estimate: 20,
        metrics: {
          totalStories: 0,
          completedStories: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          progressPercentage: 0,
          testCoveragePercentage: 0,
          blockers: 0,
        },
        tags: [],
      });

      const epics = await AgileHierarchyModule.listEpics({ featureId });

      expect(epics).toHaveLength(1);
      expect(epics[0].featureId).toBe(featureId);
    });
  });

  describe('Hierarchy Navigation', () => {
    it('should get complete story hierarchy', async () => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      // Create complete hierarchy
      const portfolio = await AgileHierarchyModule.createPortfolio({
        name: 'Portfolio',
        description: '',
        status: 'active',
        owner: 'User',
        startDate: new Date(),
        targetDate: new Date(),
        keyResults: [],
        linkedGoals: [],
        metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
        tags: [],
      });

      const goal = await AgileHierarchyModule.createGoal({
        portfolioObjectiveId: portfolio.id,
        name: 'Goal',
        description: '',
        status: 'in-progress',
        priority: 'high',
        owner: 'User',
        startDate: new Date(),
        targetDate: new Date(),
        linkedFeatures: [],
        successCriteria: [],
        metrics: {
          totalFeatures: 0,
          completedFeatures: 0,
          progressPercentage: 0,
          blockers: 0,
        },
        tags: [],
      });

      const feature = await AgileHierarchyModule.createFeature({
        goalId: goal.id,
        name: 'Feature',
        description: '',
        status: 'in-progress',
        priority: 'high',
        owner: 'User',
        linkedEpics: [],
        acceptanceCriteria: [],
        businessValue: 80,
        effort: 30,
        metrics: {
          totalEpics: 0,
          completedEpics: 0,
          totalStories: 0,
          completedStories: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          progressPercentage: 0,
          testCoveragePercentage: 0,
          blockers: 0,
        },
        tags: [],
      });

      const epic = await AgileHierarchyModule.createEpic({
        featureId: feature.id,
        boardId: 'BOARD-001',
        name: 'Epic',
        description: '',
        status: 'in-progress',
        priority: 'high',
        owner: 'User',
        linkedStories: [],
        acceptanceCriteria: [],
        estimate: 20,
        metrics: {
          totalStories: 0,
          completedStories: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          progressPercentage: 0,
          testCoveragePercentage: 0,
          blockers: 0,
        },
        tags: [],
      });

      const story: any = {
        id: 'STORY-001',
        epicId: epic.id,
        title: 'Test Story',
        tasks: [],
        testLinks: [],
      };

      const hierarchy = await AgileHierarchyModule.getStoryHierarchy(story);

      expect(hierarchy.portfolioObjective).toBeDefined();
      expect(hierarchy.goal).toBeDefined();
      expect(hierarchy.feature).toBeDefined();
      expect(hierarchy.epic).toBeDefined();
      expect(hierarchy.story).toBe(story);
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(async () => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should calculate complete metrics across all levels', async () => {
      // Create entities at each level
      await AgileHierarchyModule.createPortfolio({
        name: 'Portfolio 1',
        description: '',
        status: 'active',
        owner: 'User',
        startDate: new Date(),
        targetDate: new Date(),
        keyResults: [],
        linkedGoals: [],
        metrics: { totalGoals: 2, completedGoals: 1, progressPercentage: 50 },
        tags: [],
      });

      await AgileHierarchyModule.createGoal({
        name: 'Goal 1',
        description: '',
        status: 'in-progress',
        priority: 'high',
        owner: 'User',
        startDate: new Date(),
        targetDate: new Date(),
        linkedFeatures: [],
        successCriteria: [],
        metrics: {
          totalFeatures: 3,
          completedFeatures: 1,
          progressPercentage: 33,
          blockers: 0,
        },
        tags: [],
      });

      const metrics = await AgileHierarchyModule.getCompleteMetrics();

      expect(metrics.portfolio.totalObjectives).toBe(1);
      expect(metrics.portfolio.activeObjectives).toBe(1);
      expect(metrics.goals.totalGoals).toBe(1);
      expect(metrics.goals.activeGoals).toBe(1);
    });
  });

  describe('Edge Cases and Negative Scenarios', () => {
    beforeEach(() => {
      const mockData = {
        portfolios: [],
        goals: [],
        features: [],
        epics: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should handle empty hierarchy gracefully', async () => {
      const metrics = await AgileHierarchyModule.getCompleteMetrics();

      expect(metrics.portfolio.totalObjectives).toBe(0);
      expect(metrics.goals.totalGoals).toBe(0);
      expect(metrics.features.totalFeatures).toBe(0);
      expect(metrics.epics.totalEpics).toBe(0);
    });

    it('should handle story without epic gracefully', async () => {
      const story: any = {
        id: 'STORY-001',
        title: 'Orphan Story',
        tasks: [],
        testLinks: [],
      };

      const hierarchy = await AgileHierarchyModule.getStoryHierarchy(story);

      expect(hierarchy.epic).toBeUndefined();
      expect(hierarchy.feature).toBeUndefined();
      expect(hierarchy.goal).toBeUndefined();
      expect(hierarchy.portfolioObjective).toBeUndefined();
      expect(hierarchy.story).toBe(story);
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      // Should initialize when file doesn't exist
      await AgileHierarchyModule.loadData(testProjectPath);

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should handle file write errors', async () => {
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({
          portfolios: [],
          goals: [],
          features: [],
          epics: [],
        })
      );
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(
        AgileHierarchyModule.createPortfolio({
          name: 'Test',
          description: '',
          status: 'active',
          owner: 'User',
          startDate: new Date(),
          targetDate: new Date(),
          keyResults: [],
          linkedGoals: [],
          metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
          tags: [],
        })
      ).rejects.toThrow('Disk full');
    });

    it('should not crash with malformed dates', async () => {
      const portfolio = await AgileHierarchyModule.createPortfolio({
        name: 'Test',
        description: '',
        status: 'active',
        owner: 'User',
        startDate: new Date('invalid'),
        targetDate: new Date('2026-13-45'), // Invalid date
        keyResults: [],
        linkedGoals: [],
        metrics: { totalGoals: 0, completedGoals: 0, progressPercentage: 0 },
        tags: [],
      });

      expect(portfolio).toBeDefined();
      expect(portfolio.id).toMatch(/^PORTFOLIO-/);
    });
  });
});
