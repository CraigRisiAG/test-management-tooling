import ora from 'ora';
import { Logger } from '../utils/logger';
import { ShellExecutor } from '../utils/shell';
import { ConfigModule } from './config';
import { SetupOptions } from '../types';

/**
 * Lifecycle Module - Docker container management
 * Converted from lib/lifecycle.sh
 */
export class LifecycleModule {
  private static readonly INFRA_NETWORK = 'infra';

  /**
   * Start all Zebrunner services
   */
  static async start(): Promise<void> {
    Logger.section('Starting Zebrunner Platform');

    // Check prerequisites
    this.validatePrerequisites();

    // Create infrastructure network if needed
    if (!ShellExecutor.networkExists(this.INFRA_NETWORK)) {
      Logger.info('Creating infrastructure network...');
      ShellExecutor.createNetwork(this.INFRA_NETWORK);
    }

    // Get enabled services
    const enabledServices = ConfigModule.getEnabledServices();
    Logger.info(`Starting services: ${enabledServices.join(', ')}`);

    // Start services with spinner
    const spinner = ora('Starting Docker containers...').start();

    try {
      const result = ShellExecutor.dockerCompose('up -d');
      
      if (result.code === 0) {
        spinner.succeed('All services started successfully');
        this.displayServiceStatus();
      } else {
        spinner.fail('Failed to start services');
        Logger.error(result.stderr);
        throw new Error('Service startup failed');
      }
    } catch (error) {
      spinner.fail('Error starting services');
      throw error;
    }
  }

  /**
   * Stop all services (containers remain)
   */
  static async stop(): Promise<void> {
    Logger.section('Stopping Zebrunner Services');

    const spinner = ora('Stopping Docker containers...').start();

    try {
      const result = ShellExecutor.dockerCompose('stop');
      
      if (result.code === 0) {
        spinner.succeed('All services stopped');
      } else {
        spinner.fail('Failed to stop services');
        Logger.error(result.stderr);
      }
    } catch (error) {
      spinner.fail('Error stopping services');
      throw error;
    }
  }

  /**
   * Restart all services
   */
  static async restart(): Promise<void> {
    Logger.section('Restarting Zebrunner Services');
    await this.down();
    await this.start();
  }

  /**
   * Stop and remove containers
   */
  static async down(): Promise<void> {
    Logger.section('Stopping and Removing Containers');

    const spinner = ora('Removing Docker containers...').start();

    try {
      const result = ShellExecutor.dockerCompose('down');
      
      if (result.code === 0) {
        spinner.succeed('Containers removed');
      } else {
        spinner.fail('Failed to remove containers');
        Logger.error(result.stderr);
      }
    } catch (error) {
      spinner.fail('Error removing containers');
      throw error;
    }
  }

  /**
   * Complete shutdown with volume removal
   */
  static async shutdown(): Promise<void> {
    Logger.section('Shutting Down Platform');

    const spinner = ora('Removing containers and volumes...').start();

    try {
      const result = ShellExecutor.dockerCompose('down -v');
      
      if (result.code === 0) {
        spinner.succeed('Platform shut down completely');
        Logger.warn('All data volumes have been removed');
      } else {
        spinner.fail('Failed to shut down platform');
        Logger.error(result.stderr);
      }
    } catch (error) {
      spinner.fail('Error during shutdown');
      throw error;
    }
  }

  /**
   * Display version information
   */
  static version(): void {
    Logger.section('Zebrunner Service Versions');

    const spinner = ora('Fetching version information...').start();

    try {
      const result = ShellExecutor.dockerCompose('config --services');
      
      if (result.code === 0) {
        spinner.stop();
        
        const services = result.stdout.split('\n').filter(Boolean);
        
        services.forEach((service) => {
          const imageResult = ShellExecutor.exec(
            `docker compose config | grep -A5 "^  ${service}:" | grep "image:" | awk '{print $2}'`
          );
          
          if (imageResult.code === 0) {
            Logger.info(`${service}: ${imageResult.stdout}`);
          }
        });
      } else {
        spinner.fail('Failed to fetch versions');
      }
    } catch (error) {
      spinner.fail('Error fetching versions');
      throw error;
    }
  }

  /**
   * Validate prerequisites
   */
  private static validatePrerequisites(): void {
    if (!ShellExecutor.isDockerAvailable()) {
      throw new Error('Docker is not installed or not in PATH');
    }

    if (!ShellExecutor.isDockerComposeAvailable()) {
      throw new Error('Docker Compose is not available');
    }

    const version = ShellExecutor.getDockerComposeVersion();
    Logger.debug(`Docker Compose version: ${version}`);
  }

  /**
   * Display service status
   */
  private static displayServiceStatus(): void {
    const result = ShellExecutor.dockerCompose('ps --format json');
    
    if (result.code === 0) {
      try {
        const services = JSON.parse(`[${result.stdout.replace(/}\s*{/g, '},{')}]`);
        
        Logger.section('Service Status');
        services.forEach((service: { Name: string; State: string; Status: string }) => {
          const status = service.State === 'running' ? '✓' : '✗';
          Logger.info(`${status} ${service.Name}: ${service.Status}`);
        });
      } catch {
        Logger.debug('Could not parse service status');
      }
    }
  }
}
