"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleModule = void 0;
const ora_1 = __importDefault(require("ora"));
const logger_1 = require("../utils/logger");
const shell_1 = require("../utils/shell");
const config_1 = require("./config");
/**
 * Lifecycle Module - Docker container management
 * Converted from lib/lifecycle.sh
 */
class LifecycleModule {
    static INFRA_NETWORK = 'infra';
    /**
     * Start all Zebrunner services
     */
    static async start() {
        logger_1.Logger.section('Starting Zebrunner Platform');
        // Check prerequisites
        this.validatePrerequisites();
        // Create infrastructure network if needed
        if (!shell_1.ShellExecutor.networkExists(this.INFRA_NETWORK)) {
            logger_1.Logger.info('Creating infrastructure network...');
            shell_1.ShellExecutor.createNetwork(this.INFRA_NETWORK);
        }
        // Get enabled services
        const enabledServices = config_1.ConfigModule.getEnabledServices();
        logger_1.Logger.info(`Starting services: ${enabledServices.join(', ')}`);
        // Start services with spinner
        const spinner = (0, ora_1.default)('Starting Docker containers...').start();
        try {
            const result = shell_1.ShellExecutor.dockerCompose('up -d');
            if (result.code === 0) {
                spinner.succeed('All services started successfully');
                this.displayServiceStatus();
            }
            else {
                spinner.fail('Failed to start services');
                logger_1.Logger.error(result.stderr);
                throw new Error('Service startup failed');
            }
        }
        catch (error) {
            spinner.fail('Error starting services');
            throw error;
        }
    }
    /**
     * Stop all services (containers remain)
     */
    static async stop() {
        logger_1.Logger.section('Stopping Zebrunner Services');
        const spinner = (0, ora_1.default)('Stopping Docker containers...').start();
        try {
            const result = shell_1.ShellExecutor.dockerCompose('stop');
            if (result.code === 0) {
                spinner.succeed('All services stopped');
            }
            else {
                spinner.fail('Failed to stop services');
                logger_1.Logger.error(result.stderr);
            }
        }
        catch (error) {
            spinner.fail('Error stopping services');
            throw error;
        }
    }
    /**
     * Restart all services
     */
    static async restart() {
        logger_1.Logger.section('Restarting Zebrunner Services');
        await this.down();
        await this.start();
    }
    /**
     * Stop and remove containers
     */
    static async down() {
        logger_1.Logger.section('Stopping and Removing Containers');
        const spinner = (0, ora_1.default)('Removing Docker containers...').start();
        try {
            const result = shell_1.ShellExecutor.dockerCompose('down');
            if (result.code === 0) {
                spinner.succeed('Containers removed');
            }
            else {
                spinner.fail('Failed to remove containers');
                logger_1.Logger.error(result.stderr);
            }
        }
        catch (error) {
            spinner.fail('Error removing containers');
            throw error;
        }
    }
    /**
     * Complete shutdown with volume removal
     */
    static async shutdown() {
        logger_1.Logger.section('Shutting Down Platform');
        const spinner = (0, ora_1.default)('Removing containers and volumes...').start();
        try {
            const result = shell_1.ShellExecutor.dockerCompose('down -v');
            if (result.code === 0) {
                spinner.succeed('Platform shut down completely');
                logger_1.Logger.warn('All data volumes have been removed');
            }
            else {
                spinner.fail('Failed to shut down platform');
                logger_1.Logger.error(result.stderr);
            }
        }
        catch (error) {
            spinner.fail('Error during shutdown');
            throw error;
        }
    }
    /**
     * Display version information
     */
    static version() {
        logger_1.Logger.section('Zebrunner Service Versions');
        const spinner = (0, ora_1.default)('Fetching version information...').start();
        try {
            const result = shell_1.ShellExecutor.dockerCompose('config --services');
            if (result.code === 0) {
                spinner.stop();
                const services = result.stdout.split('\n').filter(Boolean);
                services.forEach((service) => {
                    const imageResult = shell_1.ShellExecutor.exec(`docker compose config | grep -A5 "^  ${service}:" | grep "image:" | awk '{print $2}'`);
                    if (imageResult.code === 0) {
                        logger_1.Logger.info(`${service}: ${imageResult.stdout}`);
                    }
                });
            }
            else {
                spinner.fail('Failed to fetch versions');
            }
        }
        catch (error) {
            spinner.fail('Error fetching versions');
            throw error;
        }
    }
    /**
     * Validate prerequisites
     */
    static validatePrerequisites() {
        if (!shell_1.ShellExecutor.isDockerAvailable()) {
            throw new Error('Docker is not installed or not in PATH');
        }
        if (!shell_1.ShellExecutor.isDockerComposeAvailable()) {
            throw new Error('Docker Compose is not available');
        }
        const version = shell_1.ShellExecutor.getDockerComposeVersion();
        logger_1.Logger.debug(`Docker Compose version: ${version}`);
    }
    /**
     * Display service status
     */
    static displayServiceStatus() {
        const result = shell_1.ShellExecutor.dockerCompose('ps --format json');
        if (result.code === 0) {
            try {
                const services = JSON.parse(`[${result.stdout.replace(/}\s*{/g, '},{')}]`);
                logger_1.Logger.section('Service Status');
                services.forEach((service) => {
                    const status = service.State === 'running' ? '✓' : '✗';
                    logger_1.Logger.info(`${status} ${service.Name}: ${service.Status}`);
                });
            }
            catch {
                logger_1.Logger.debug('Could not parse service status');
            }
        }
    }
}
exports.LifecycleModule = LifecycleModule;
//# sourceMappingURL=lifecycle.js.map