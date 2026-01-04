import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { ZebrunnerConfig } from '../types';
import { Logger } from '../utils/logger';

/**
 * Configuration Module
 * Converted from lib/config.sh
 */
export class ConfigModule {
  private static readonly CONFIG_DIR = path.join(process.cwd(), 'reporting');
  private static readonly SETTINGS_FILE = path.join(this.CONFIG_DIR, '.env');

  /**
   * Set global settings interactively
   */
  static async setGlobalSettings(): Promise<ZebrunnerConfig> {
    Logger.section('Global Configuration');

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'protocol',
        message: 'Select protocol:',
        choices: ['http', 'https'],
        default: 'http',
      },
      {
        type: 'input',
        name: 'hostname',
        message: 'Enter hostname or IP:',
        default: 'localhost',
        validate: (input: string) => input.length > 0 || 'Hostname is required',
      },
      {
        type: 'input',
        name: 'port',
        message: 'Enter port:',
        default: '80',
        validate: (input: string) => {
          const port = parseInt(input);
          return (port > 0 && port < 65536) || 'Port must be between 1 and 65535';
        },
      },
    ]);

    Logger.success('Global settings configured');
    return answers as ZebrunnerConfig;
  }

  /**
   * Enable a service layer
   */
  static async enableLayer(serviceName: string): Promise<void> {
    const serviceDir = path.join(process.cwd(), serviceName);
    const disabledFile = path.join(serviceDir, '.disabled');

    if (!fs.existsSync(serviceDir)) {
      throw new Error(`Service directory not found: ${serviceName}`);
    }

    if (!fs.existsSync(disabledFile)) {
      Logger.info(`Service ${serviceName} is already enabled`);
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Enable ${serviceName} service?`,
        default: true,
      },
    ]);

    if (confirm) {
      fs.unlinkSync(disabledFile);
      Logger.success(`Service ${serviceName} enabled`);
    } else {
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
