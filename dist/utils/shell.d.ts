import { ExecOptions } from 'shelljs';
import { CommandResult } from '../types';
/**
 * Shell command execution utilities
 */
export declare class ShellExecutor {
    /**
     * Execute shell command synchronously
     */
    static exec(command: string, options?: ExecOptions): CommandResult;
    /**
     * Execute shell command and throw on error
     */
    static execOrThrow(command: string, options?: ExecOptions): string;
    /**
     * Execute Docker Compose command
     */
    static dockerCompose(args: string, options?: ExecOptions): CommandResult;
    /**
     * Execute Docker command
     */
    static docker(args: string, options?: ExecOptions): CommandResult;
    /**
     * Check if command exists
     */
    static commandExists(command: string): boolean;
    /**
     * Check if Docker is available
     */
    static isDockerAvailable(): boolean;
    /**
     * Check if Docker Compose is available
     */
    static isDockerComposeAvailable(): boolean;
    /**
     * Get Docker Compose version
     */
    static getDockerComposeVersion(): string | null;
    /**
     * Check if Docker network exists
     */
    static networkExists(networkName: string): boolean;
    /**
     * Create Docker network
     */
    static createNetwork(networkName: string): boolean;
}
//# sourceMappingURL=shell.d.ts.map