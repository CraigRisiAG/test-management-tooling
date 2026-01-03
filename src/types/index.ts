/**
 * Type definitions for Zebrunner platform
 */

export interface ZebrunnerConfig {
  protocol: string;
  hostname: string;
  port: string;
  reporting?: ServiceConfig;
  sonarqube?: ServiceConfig;
  jenkins?: ServiceConfig;
  selenoid?: ServiceConfig;
  mcloud?: ServiceConfig;
}

export interface ServiceConfig {
  enabled: boolean;
  version?: string;
  port?: number;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

export interface BackupData {
  timestamp: string;
  version: string;
  services: string[];
  files: string[];
}

export interface SetupOptions {
  enableReporting?: boolean;
  enableSonarqube?: boolean;
  enableJenkins?: boolean;
  enableSelenoid?: boolean;
  enableMcloud?: boolean;
  interactive?: boolean;
}

export interface DockerComposeService {
  image: string;
  container_name: string;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  depends_on?: string[];
}

export interface DockerComposeConfig {
  version: string;
  services: Record<string, DockerComposeService>;
  networks?: Record<string, unknown>;
  volumes?: Record<string, unknown>;
}

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface VersionInfo {
  service: string;
  version: string;
  image: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';
