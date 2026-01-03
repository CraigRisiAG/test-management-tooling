/**
 * Zebrunner Platform - TypeScript Entry Point
 * 
 * This module exports all core functionality for programmatic usage
 */

// Modules
export { UIModule } from './modules/ui';
export { ConfigModule } from './modules/config';
export { LifecycleModule } from './modules/lifecycle';

// Utilities
export { Logger } from './utils/logger';
export { ShellExecutor } from './utils/shell';

// Types
export * from './types';

// Version
export const VERSION = '2.6.0';
