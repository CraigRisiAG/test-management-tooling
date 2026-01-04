import fs from 'fs';
import path from 'path';
import { TestManagementConfig } from '../types';
import { Logger } from '../utils/logger';
import type inquirer from 'inquirer';

/**
 * Configuration Module
 * Manages test management system configuration
 */
export class ConfigModule {
  private static readonly CONFIG_DIR = path.join(process.cwd(), '.testmgr');
  private static readonly CONFIG_FILE = path.join(this.CONFIG_DIR, 'config.json');
  private static readonly SETTINGS_FILE = path.join(this.CONFIG_DIR, 'settings.env');

  /**
   * Initialize configuration (interactive project setup)
   */
  static async initialize(): Promise<TestManagementConfig> {
    Logger.section('Test Management Configuration');

    const inquirerModule = await import('inquirer');
    const prompt = (inquirerModule as any).default?.prompt ?? (inquirerModule as any).prompt;

    const answers = await prompt([
      {
        type: 'input',
        name: 'dataDir',
        message: 'Data directory for storing tests and stories:',
        default: './test-data',
      },
      {
        type: 'input',
        name: 'workspaceRoot',
        message: 'Workspace root directory:',
        default: process.cwd(),
      },
      {
        type: 'input',
        name: 'defaultExecutor',
        message: 'Default test executor name:',
        default: 'system',
      },
    ]);

    const config: TestManagementConfig = {
      dataDir: answers.dataDir,
      workspaceRoot: answers.workspaceRoot,
      defaultExecutor: answers.defaultExecutor,
    };

    await this.saveProjectConfig(config);
    Logger.success('Configuration saved');
    return config;
  }

  /**
   * Load JSON project configuration
   */
  static async loadProjectConfig(): Promise<TestManagementConfig | null> {
    try {
      if (!fs.existsSync(this.CONFIG_FILE)) {
        return null;
      }

      const content = await fs.promises.readFile(this.CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      Logger.error(`Failed to load config: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Save JSON project configuration
   */
  static async saveProjectConfig(config: TestManagementConfig): Promise<void> {
    if (!fs.existsSync(this.CONFIG_DIR)) {
      await fs.promises.mkdir(this.CONFIG_DIR, { recursive: true });
    }

    await fs.promises.writeFile(
      this.CONFIG_FILE,
      JSON.stringify(config, null, 2)
    );
  }

  /**
   * Disable a service layer (no-op now that external services are removed)
   */
  static async disableLayer(serviceName: string): Promise<void> {
    Logger.info(`Service ${serviceName} is no longer managed; skipping disable.`);
  }

  /**
   * Check if service is enabled (always false since modules were removed)
   */
  static isServiceEnabled(_serviceName: string): boolean {
    return false;
  }

  /**
   * Load key/value settings from settings.env
   */
  static loadConfig(): Record<string, string> {
    if (!fs.existsSync(this.SETTINGS_FILE)) {
      return {};
    }

    const content = fs.readFileSync(this.SETTINGS_FILE, 'utf-8');
    const config: Record<string, string> = {};

    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return config;
  }

  /**
   * Save key/value settings to settings.env
   */
  static saveConfig(config: Record<string, string>): void {
    const lines = Object.entries(config).map(([key, value]) => `${key}=${value}`);

    if (!fs.existsSync(this.CONFIG_DIR)) {
      fs.mkdirSync(this.CONFIG_DIR, { recursive: true });
    }

    fs.writeFileSync(this.SETTINGS_FILE, lines.join('\n') + '\n');
    Logger.success('Configuration saved');
  }

  /**
   * Update a single setting
   */
  static updateConfigValue(key: string, value: string): void {
    const config = this.loadConfig();
    config[key] = value;
    this.saveConfig(config);
  }

  /**
   * Get a setting by key
   */
  static getConfigValue(key: string, defaultValue?: string): string | undefined {
    const config = this.loadConfig();
    return config[key] ?? defaultValue;
  }

  /**
   * List all enabled services (none now)
   */
  static getEnabledServices(): string[] {
    return [];
  }
}
