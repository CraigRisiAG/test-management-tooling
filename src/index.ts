/**
 * Custom Test Management Platform - TypeScript Entry Point
 * 
 * This module exports all core functionality for programmatic usage
 */

// Core Test Management Modules
export { TestRegistry } from './modules/test-registry';
export { TestExecutor } from './modules/test-executor';
export { CodeTracer } from './modules/code-tracer';
export { DashboardReporter } from './modules/dashboard-reporter';

// Supporting Modules
export { UIModule } from './modules/ui';
export { ConfigModule } from './modules/config';
export { GitOpsModule } from './modules/gitops';
export { RepositoryViewerModule } from './modules/repository-viewer';
export { AgileModule } from './modules/agile';

// Utilities
export { Logger } from './utils/logger';
export { ShellExecutor } from './utils/shell';

// Types
export * from './types';

// Version
export const VERSION = '1.0.0';
