"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellExecutor = void 0;
const shelljs_1 = require("shelljs");
const logger_1 = require("./logger");
/**
 * Shell command execution utilities
 */
class ShellExecutor {
    /**
     * Execute shell command synchronously
     */
    static exec(command, options) {
        logger_1.Logger.debug(`Executing: ${command}`);
        const result = (0, shelljs_1.exec)(command, { silent: true, ...options });
        return {
            code: result.code,
            stdout: result.stdout.trim(),
            stderr: result.stderr.trim(),
        };
    }
    /**
     * Execute shell command and throw on error
     */
    static execOrThrow(command, options) {
        const result = this.exec(command, options);
        if (result.code !== 0) {
            throw new Error(`Command failed: ${command}\n${result.stderr}`);
        }
        return result.stdout;
    }
    /**
     * Execute Docker Compose command
     */
    static dockerCompose(args, options) {
        return this.exec(`docker compose ${args}`, options);
    }
    /**
     * Execute Docker command
     */
    static docker(args, options) {
        return this.exec(`docker ${args}`, options);
    }
    /**
     * Check if command exists
     */
    static commandExists(command) {
        const result = this.exec(`command -v ${command} || where ${command}`);
        return result.code === 0;
    }
    /**
     * Check if Docker is available
     */
    static isDockerAvailable() {
        return this.commandExists('docker');
    }
    /**
     * Check if Docker Compose is available
     */
    static isDockerComposeAvailable() {
        const result = this.exec('docker compose version');
        return result.code === 0;
    }
    /**
     * Get Docker Compose version
     */
    static getDockerComposeVersion() {
        const result = this.exec('docker compose version');
        if (result.code !== 0)
            return null;
        const match = result.stdout.match(/v?(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    }
    /**
     * Check if Docker network exists
     */
    static networkExists(networkName) {
        const result = this.exec(`docker network ls --filter name=^${networkName}$ --format "{{.Name}}"`);
        return result.stdout.includes(networkName);
    }
    /**
     * Create Docker network
     */
    static createNetwork(networkName) {
        const result = this.exec(`docker network create ${networkName}`);
        return result.code === 0;
    }
}
exports.ShellExecutor = ShellExecutor;
//# sourceMappingURL=shell.js.map