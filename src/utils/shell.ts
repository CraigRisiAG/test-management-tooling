import { exec, ExecOptions } from 'shelljs';
import { CommandResult } from '../types';
import { Logger } from './logger';

/**
 * Shell command execution utilities
 */
export class ShellExecutor {
  /**
   * Execute shell command synchronously
   */
  static exec(command: string, options?: ExecOptions): CommandResult {
    Logger.debug(`Executing: ${command}`);
    
    const result = exec(command, { silent: true, ...options }) as any;
    
    return {
      code: result.code,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  }

  /**
   * Execute shell command and throw on error
   */
  static execOrThrow(command: string, options?: ExecOptions): string {
    const result = this.exec(command, options);
    
    if (result.code !== 0) {
      throw new Error(`Command failed: ${command}\n${result.stderr}`);
    }
    
    return result.stdout;
  }

  /**
   * Execute Docker Compose command
   */
  static dockerCompose(args: string, options?: ExecOptions): CommandResult {
    return this.exec(`docker compose ${args}`, options);
  }

  /**
   * Execute Docker command
   */
  static docker(args: string, options?: ExecOptions): CommandResult {
    return this.exec(`docker ${args}`, options);
  }

  /**
   * Check if command exists
   */
  static commandExists(command: string): boolean {
    const result = this.exec(`command -v ${command} || where ${command}`);
    return result.code === 0;
  }

  /**
   * Check if Docker is available
   */
  static isDockerAvailable(): boolean {
    return this.commandExists('docker');
  }

  /**
   * Check if Docker Compose is available
   */
  static isDockerComposeAvailable(): boolean {
    const result = this.exec('docker compose version');
    return result.code === 0;
  }

  /**
   * Get Docker Compose version
   */
  static getDockerComposeVersion(): string | null {
    const result = this.exec('docker compose version');
    if (result.code !== 0) return null;
    
    const match = result.stdout.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if Docker network exists
   */
  static networkExists(networkName: string): boolean {
    const result = this.exec(`docker network ls --filter name=^${networkName}$ --format "{{.Name}}"`);
    return result.stdout.includes(networkName);
  }

  /**
   * Create Docker network
   */
  static createNetwork(networkName: string): boolean {
    const result = this.exec(`docker network create ${networkName}`);
    return result.code === 0;
  }
}
