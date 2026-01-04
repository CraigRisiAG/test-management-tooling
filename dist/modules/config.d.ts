import { ZebrunnerConfig } from '../types';
/**
 * Configuration Module
 * Converted from lib/config.sh
 */
export declare class ConfigModule {
    private static readonly CONFIG_DIR;
    private static readonly SETTINGS_FILE;
    /**
     * Set global settings interactively
     */
    static setGlobalSettings(): Promise<ZebrunnerConfig>;
    /**
     * Enable a service layer
     */
    static enableLayer(serviceName: string): Promise<void>;
    /**
     * Disable a service layer
     */
    static disableLayer(serviceName: string): Promise<void>;
    /**
     * Check if service is enabled
     */
    static isServiceEnabled(serviceName: string): boolean;
    /**
     * Load configuration from .env file
     */
    static loadConfig(): Record<string, string>;
    /**
     * Save configuration to .env file
     */
    static saveConfig(config: Record<string, string>): void;
    /**
     * Update configuration value
     */
    static updateConfigValue(key: string, value: string): void;
    /**
     * Get configuration value
     */
    static getConfigValue(key: string, defaultValue?: string): string | undefined;
    /**
     * List all enabled services
     */
    static getEnabledServices(): string[];
}
//# sourceMappingURL=config.d.ts.map