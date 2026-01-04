"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModule = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const logger_1 = require("../utils/logger");
/**
 * Configuration Module
 * Converted from lib/config.sh
 */
class ConfigModule {
    static CONFIG_DIR = path_1.default.join(process.cwd(), 'reporting');
    static SETTINGS_FILE = path_1.default.join(this.CONFIG_DIR, '.env');
    /**
     * Set global settings interactively
     */
    static async setGlobalSettings() {
        logger_1.Logger.section('Global Configuration');
        const answers = await inquirer_1.default.prompt([
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
                validate: (input) => input.length > 0 || 'Hostname is required',
            },
            {
                type: 'input',
                name: 'port',
                message: 'Enter port:',
                default: '80',
                validate: (input) => {
                    const port = parseInt(input);
                    return (port > 0 && port < 65536) || 'Port must be between 1 and 65535';
                },
            },
        ]);
        logger_1.Logger.success('Global settings configured');
        return answers;
    }
    /**
     * Enable a service layer
     */
    static async enableLayer(serviceName) {
        const serviceDir = path_1.default.join(process.cwd(), serviceName);
        const disabledFile = path_1.default.join(serviceDir, '.disabled');
        if (!fs_1.default.existsSync(serviceDir)) {
            throw new Error(`Service directory not found: ${serviceName}`);
        }
        if (!fs_1.default.existsSync(disabledFile)) {
            logger_1.Logger.info(`Service ${serviceName} is already enabled`);
            return;
        }
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Enable ${serviceName} service?`,
                default: true,
            },
        ]);
        if (confirm) {
            fs_1.default.unlinkSync(disabledFile);
            logger_1.Logger.success(`Service ${serviceName} enabled`);
        }
        else {
            logger_1.Logger.info('Operation cancelled');
        }
    }
    /**
     * Disable a service layer
     */
    static async disableLayer(serviceName) {
        const serviceDir = path_1.default.join(process.cwd(), serviceName);
        const disabledFile = path_1.default.join(serviceDir, '.disabled');
        if (!fs_1.default.existsSync(serviceDir)) {
            throw new Error(`Service directory not found: ${serviceName}`);
        }
        if (fs_1.default.existsSync(disabledFile)) {
            logger_1.Logger.info(`Service ${serviceName} is already disabled`);
            return;
        }
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Disable ${serviceName} service?`,
                default: false,
            },
        ]);
        if (confirm) {
            fs_1.default.writeFileSync(disabledFile, '');
            logger_1.Logger.success(`Service ${serviceName} disabled`);
        }
        else {
            logger_1.Logger.info('Operation cancelled');
        }
    }
    /**
     * Check if service is enabled
     */
    static isServiceEnabled(serviceName) {
        const serviceDir = path_1.default.join(process.cwd(), serviceName);
        const disabledFile = path_1.default.join(serviceDir, '.disabled');
        return !fs_1.default.existsSync(disabledFile);
    }
    /**
     * Load configuration from .env file
     */
    static loadConfig() {
        if (!fs_1.default.existsSync(this.SETTINGS_FILE)) {
            return {};
        }
        const content = fs_1.default.readFileSync(this.SETTINGS_FILE, 'utf-8');
        const config = {};
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
    static saveConfig(config) {
        const lines = Object.entries(config).map(([key, value]) => `${key}=${value}`);
        if (!fs_1.default.existsSync(this.CONFIG_DIR)) {
            fs_1.default.mkdirSync(this.CONFIG_DIR, { recursive: true });
        }
        fs_1.default.writeFileSync(this.SETTINGS_FILE, lines.join('\n') + '\n');
        logger_1.Logger.success('Configuration saved');
    }
    /**
     * Update configuration value
     */
    static updateConfigValue(key, value) {
        const config = this.loadConfig();
        config[key] = value;
        this.saveConfig(config);
    }
    /**
     * Get configuration value
     */
    static getConfigValue(key, defaultValue) {
        const config = this.loadConfig();
        return config[key] ?? defaultValue;
    }
    /**
     * List all enabled services
     */
    static getEnabledServices() {
        const services = ['reporting', 'sonarqube', 'jenkins', 'selenoid', 'mcloud'];
        return services.filter((service) => this.isServiceEnabled(service));
    }
}
exports.ConfigModule = ConfigModule;
//# sourceMappingURL=config.js.map