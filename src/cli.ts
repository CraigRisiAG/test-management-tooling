#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { UIModule } from './modules/ui';
import { ConfigModule } from './modules/config';
import { LifecycleModule } from './modules/lifecycle';
import { Logger } from './utils/logger';

/**
 * Zebrunner CLI - Main Entry Point
 * Converted from zebrunner.sh
 */

const program = new Command();

program
  .name('zebrunner')
  .description('Zebrunner Test Management Platform CLI')
  .version('2.6.0')
  .option('--debug', 'Enable debug logging')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
      Logger.enableDebug();
    }
  });

// Setup command
program
  .command('setup')
  .description('Setup Zebrunner platform and configure services')
  .action(async () => {
    try {
      UIModule.printBanner();
      Logger.info('Starting Zebrunner setup...');
      
      // Configuration will be implemented in setup module
      Logger.warn('Setup functionality coming soon');
      
    } catch (error) {
      Logger.error(`Setup failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Start command
program
  .command('start')
  .description('Start all Zebrunner services')
  .action(async () => {
    try {
      await LifecycleModule.start();
    } catch (error) {
      Logger.error(`Start failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop all services (containers remain)')
  .action(async () => {
    try {
      await LifecycleModule.stop();
    } catch (error) {
      Logger.error(`Stop failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Restart command
program
  .command('restart')
  .description('Restart all services')
  .action(async () => {
    try {
      await LifecycleModule.restart();
    } catch (error) {
      Logger.error(`Restart failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Down command
program
  .command('down')
  .description('Stop and remove all containers')
  .action(async () => {
    try {
      await LifecycleModule.down();
    } catch (error) {
      Logger.error(`Down failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Shutdown command
program
  .command('shutdown')
  .description('Shutdown platform and remove volumes')
  .action(async () => {
    try {
      await LifecycleModule.shutdown();
    } catch (error) {
      Logger.error(`Shutdown failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Version command
program
  .command('version')
  .description('Display service versions')
  .action(() => {
    try {
      LifecycleModule.version();
    } catch (error) {
      Logger.error(`Version check failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Enable command
program
  .command('enable <service>')
  .description('Enable a service layer')
  .action(async (service: string) => {
    try {
      await ConfigModule.enableLayer(service);
    } catch (error) {
      Logger.error(`Enable failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Disable command
program
  .command('disable <service>')
  .description('Disable a service layer')
  .action(async (service: string) => {
    try {
      await ConfigModule.disableLayer(service);
    } catch (error) {
      Logger.error(`Disable failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Help command (override default)
program
  .command('help')
  .description('Display help information')
  .action(() => {
    UIModule.showHelp();
  });

// Default action - show help if no command
program.action(() => {
  UIModule.printBanner();
  UIModule.showHelp();
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  UIModule.printBanner();
  UIModule.showHelp();
}
