import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { TestManagementConfig } from '../types';
import { Logger } from '../utils/logger';

/**
 * Configuration Module
 * Manages test management system configuration
 */
export class ConfigModule {
  private static readonly CONFIG_DIR = path.join(process.cwd(), '.testmgr');
  private static readonly CONFIG_FILE = path.join(this.CONFIG_DIR, 'config.json');

  /**
   * Initialize configuration
   */
  static async initialize(): Promise<TestManagementConfig> {
    Logger.section('Test Management Configuration');

    const answers = await inquirer.prompt([
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

    await this.saveConfig(config);
    Logger.success('Configuration saved');
    return config;
  }

  /**
   * Load configuration
   */
  static async loadConfig(): Promise<TestManagementConfig | null> {
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
   * Save configuration
   */
  static async saveConfig(config: TestManagementConfig): Promise<void> {
    try {
      if (!fs.existsSync(this.CONFIG_DIR)) {
        await fs.promises.mkdir(this.CONFIG_DIR, { recursive: true });
      }

      await fs.promises.writeFile(
        this.CONFIG_FILE,
        JSON.stringify(config, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to save config: ${(error as Error).message}`);
    }
  }
      Logger.info('Operation cancelled');
    }
  }

  /**
   * Disable a service layer
   */
  static async disableLayer(serviceName: string): Promise<void> {
    const serviceDir = path.join(process.cwd(), serviceName);
    const disabledFile = path.join(serviceDir, '.disabled');

    if (!fs.existsSync(serviceDir)) {
      throw new Error(`Service directory not found: ${serviceName}`);
    }

    if (fs.existsSync(disabledFile)) {
      Logger.info(`Service ${serviceName} is already disabled`);
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Disable ${serviceName} service?`,
        default: false,
      },
    ]);

    if (confirm) {
      fs.writeFileSync(disabledFile, '');
      Logger.success(`Service ${serviceName} disabled`);
    } else {
      Logger.info('Operation cancelled');
    }
  }

  /**
   * Check if service is enabled
   */
  static isServiceEnabled(serviceName: string): boolean {
    const serviceDir = path.join(process.cwd(), serviceName);
    const disabledFile = path.join(serviceDir, '.disabled');
    return !fs.existsSync(disabledFile);
  }

  /**
   * Load configuration from .env file
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
   * Save configuration to .env file
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
   * Update configuration value
   */
  static updateConfigValue(key: string, value: string): void {
    const config = this.loadConfig();
    config[key] = value;
    this.saveConfig(config);
  }

  /**
   * Get configuration value
   */
  static getConfigValue(key: string, defaultValue?: string): string | undefined {
    const config = this.loadConfig();
    return config[key] ?? defaultValue;
  }

  /**
   * List all enabled services
   */
  static getEnabledServices(): string[] {
    const services = ['reporting', 'sonarqube', 'jenkins', 'selenoid', 'mcloud'];
    return services.filter((service) => this.isServiceEnabled(service));
  }
}
