import chalk from 'chalk';
import { LogLevel } from '../types';

/**
 * Logger utility for consistent console output
 */
export class Logger {
  private static debugEnabled = process.env.DEBUG === 'true';

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✔'), message);
  }

  static warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✖'), message);
  }

  static debug(message: string): void {
    if (this.debugEnabled) {
      console.log(chalk.gray('🐛'), chalk.gray(message));
    }
  }

  static log(level: LogLevel, message: string): void {
    switch (level) {
      case 'info':
        this.info(message);
        break;
      case 'success':
        this.success(message);
        break;
      case 'warn':
        this.warn(message);
        break;
      case 'error':
        this.error(message);
        break;
      case 'debug':
        this.debug(message);
        break;
    }
  }

  static banner(text: string): void {
    console.log(chalk.cyan.bold('\n' + text + '\n'));
  }

  static section(title: string): void {
    console.log('\n' + chalk.bold.underline(title));
  }

  static table(data: Record<string, string>[]): void {
    console.table(data);
  }

  static enableDebug(): void {
    this.debugEnabled = true;
  }

  static disableDebug(): void {
    this.debugEnabled = false;
  }
}
