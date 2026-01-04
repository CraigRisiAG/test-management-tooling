import {
  Defect,
  CodeReference,
  DefectMetrics,
} from '../types';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Defect Management Module
 * Tracks defects found during testing and their resolution
 */
export class DefectManager {
  private defects: Map<string, Defect> = new Map();
  private logger: Logger;
  private dataDir: string;
  private defectsFile: string;

  constructor(dataDir: string = './test-data') {
    this.logger = new Logger('info');
    this.dataDir = dataDir;
    this.defectsFile = path.join(dataDir, 'defects.json');
  }

  /**
   * Initialize defect manager and load existing defects
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadDefects();
      this.logger.info('Defect manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize defect manager', error as Error);
      throw error;
    }
  }

  /**
   * Create a new defect from test failure
   */
  async createDefectFromTest(
    testId: string,
    title: string,
    description: string,
    detectedBy: string,
    severity: Defect['severity']
  ): Promise<Defect> {
    const defect: Defect = {
      id: `DEF-${Date.now()}`,
      title,
      description,
      severity,
      status: 'new',
      detectedIn: testId,
      detectedAt: new Date(),
      detectedBy,
      affectedCode: [],
      riskLevel: severity === 'critical' ? 'critical' : severity === 'major' ? 'high' : 'medium',
      linkedPullRequests: [],
    };

    this.defects.set(defect.id, defect);
    await this.saveDefects();
    this.logger.info(`Defect created: ${defect.id} from test ${testId}`);

    return defect;
  }

  /**
   * Get defect by ID
   */
  getDefect(defectId: string): Defect | undefined {
    return this.defects.get(defectId);
  }

  /**
   * Get all defects
   */
  getAllDefects(): Defect[] {
    return Array.from(this.defects.values());
  }

  /**
   * Update defect status
   */
  async updateStatus(defectId: string, status: Defect['status'], updatedBy?: string): Promise<void> {
    const defect = this.defects.get(defectId);
    if (!defect) {
      throw new Error(`Defect ${defectId} not found`);
    }

    defect.status = status;

    if (status === 'fixed') {
      defect.resolvedAt = new Date();
      defect.resolvedBy = updatedBy;
    }

    if (status === 'verified') {
      defect.verifiedAt = new Date();
      defect.verifiedBy = updatedBy;
    }

    await this.saveDefects();
    this.logger.info(`Defect ${defectId} status updated to: ${status}`);
  }

  /**
   * Add affected code reference
   */
  async addAffectedCode(defectId: string, codeRef: CodeReference): Promise<void> {
    const defect = this.defects.get(defectId);
    if (!defect) {
      throw new Error(`Defect ${defectId} not found`);
    }

    defect.affectedCode.push(codeRef);
    await this.saveDefects();
    this.logger.info(`Code reference added to defect ${defectId}`);
  }

  /**
   * Set root cause and resolution
   */
  async setResolution(
    defectId: string,
    rootCause: string,
    resolution: string
  ): Promise<void> {
    const defect = this.defects.get(defectId);
    if (!defect) {
      throw new Error(`Defect ${defectId} not found`);
    }

    defect.rootCause = rootCause;
    defect.resolution = resolution;
    await this.saveDefects();
    this.logger.info(`Resolution set for defect ${defectId}`);
  }

  /**
   * Link pull request to defect
   */
  async linkPullRequest(defectId: string, prUrl: string): Promise<void> {
    const defect = this.defects.get(defectId);
    if (!defect) {
      throw new Error(`Defect ${defectId} not found`);
    }

    if (!defect.linkedPullRequests) {
      defect.linkedPullRequests = [];
    }

    if (!defect.linkedPullRequests.includes(prUrl)) {
      defect.linkedPullRequests.push(prUrl);
      await this.saveDefects();
      this.logger.info(`PR ${prUrl} linked to defect ${defectId}`);
    }
  }

  /**
   * Get defects by status
   */
  getDefectsByStatus(status: Defect['status']): Defect[] {
    return Array.from(this.defects.values()).filter(d => d.status === status);
  }

  /**
   * Get critical defects
   */
  getCriticalDefects(): Defect[] {
    return Array.from(this.defects.values()).filter(d => d.severity === 'critical');
  }

  /**
   * Get unverified defects
   */
  getUnverifiedDefects(): Defect[] {
    return Array.from(this.defects.values()).filter(d => d.status === 'fixed' && !d.verifiedAt);
  }

  /**
   * Get defect metrics
   */
  getMetrics(): DefectMetrics {
    const defects = Array.from(this.defects.values());

    return {
      totalDefects: defects.length,
      newDefects: defects.filter(d => d.status === 'new').length,
      fixedDefects: defects.filter(d => d.status === 'fixed' || d.status === 'verified').length,
      unverifiedDefects: defects.filter(d => d.status === 'fixed' && !d.verifiedAt).length,
      defectsByStatus: this.groupBy(defects, 'status'),
      defectsBySeverity: this.groupBy(defects, 'severity'),
      criticalDefects: defects.filter(d => d.severity === 'critical'),
    };
  }

  /**
   * Get defects for a specific test
   */
  getDefectsForTest(testId: string): Defect[] {
    return Array.from(this.defects.values()).filter(d => d.detectedIn === testId);
  }

  /**
   * Get health score (0-100) based on defect status
   */
  getHealthScore(): number {
    const defects = Array.from(this.defects.values());
    if (defects.length === 0) return 100;

    const critical = defects.filter(d => d.severity === 'critical' && d.status !== 'closed').length;
    const major = defects.filter(d => d.severity === 'major' && d.status !== 'closed').length;
    const minor = defects.filter(d => d.severity === 'minor' && d.status !== 'closed').length;

    // Scoring: critical = 10 points, major = 5 points, minor = 1 point
    const score = Math.max(0, 100 - (critical * 10 + major * 5 + minor * 1));
    return score;
  }

  private groupBy(items: Defect[], key: keyof Defect): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async loadDefects(): Promise<void> {
    try {
      const data = await fs.readFile(this.defectsFile, 'utf-8');
      const defects: Defect[] = JSON.parse(data);
      defects.forEach(defect => this.defects.set(defect.id, defect));
      this.logger.debug(`Loaded ${defects.length} defects`);
    } catch (error) {
      this.logger.debug('No existing defects found');
    }
  }

  private async saveDefects(): Promise<void> {
    const defects = Array.from(this.defects.values());
    await fs.writeFile(this.defectsFile, JSON.stringify(defects, null, 2));
  }
}
