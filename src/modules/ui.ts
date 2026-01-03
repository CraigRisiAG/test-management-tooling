import figlet from 'figlet';
import boxen from 'boxen';
import chalk from 'chalk';
import { Logger } from '../utils/logger';

/**
 * UI Module - Display functions
 * Converted from lib/ui.sh
 */
export class UIModule {
  /**
   * Display Zebrunner banner
   */
  static printBanner(): void {
    const banner = figlet.textSync('ZEBRUNNER', {
      font: 'Standard',
      horizontalLayout: 'default',
    });
    
    console.log(chalk.cyan(banner));
    console.log(chalk.gray('Test Management Platform v2.6.0\n'));
  }

  /**
   * Display help information
   */
  static showHelp(): void {
    const helpText = `
${chalk.bold('USAGE:')}
  zebrunner [COMMAND]

${chalk.bold('COMMANDS:')}
  ${chalk.cyan('setup')}        Setup Zebrunner platform and configure services
  ${chalk.cyan('start')}        Start all Zebrunner services
  ${chalk.cyan('stop')}         Stop all services (containers remain)
  ${chalk.cyan('restart')}      Restart all services
  ${chalk.cyan('down')}         Stop and remove all containers
  ${chalk.cyan('shutdown')}     Shutdown platform and remove volumes
  ${chalk.cyan('backup')}       Backup platform data and configuration
  ${chalk.cyan('restore')}      Restore platform from backup
  ${chalk.cyan('upgrade')}      Upgrade platform to latest version
  ${chalk.cyan('version')}      Display service versions
  ${chalk.cyan('enable')}       Enable a service layer
  ${chalk.cyan('disable')}      Disable a service layer
  ${chalk.cyan('help')}         Display this help message

${chalk.bold('OPTIONS:')}
  -h, --help        Show help information
  -v, --version     Show version information
  --debug           Enable debug logging

${chalk.bold('EXAMPLES:')}
  zebrunner setup              # Interactive setup
  zebrunner start              # Start all services
  zebrunner backup             # Backup configuration and data
  zebrunner enable reporting   # Enable reporting service
  zebrunner disable mcloud     # Disable mcloud service

${chalk.bold('DOCUMENTATION:')}
  Visit: https://zebrunner.com/documentation
`;

    console.log(helpText);
  }

  /**
   * Display notice/information box
   */
  static showNotice(title: string, content: string): void {
    const box = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      title,
      titleAlignment: 'center',
      borderColor: 'cyan',
    });
    
    console.log(box);
  }

  /**
   * Display success message
   */
  static showSuccess(message: string): void {
    Logger.success(message);
  }

  /**
   * Display error message
   */
  static showError(message: string): void {
    Logger.error(message);
  }

  /**
   * Display warning message
   */
  static showWarning(message: string): void {
    Logger.warn(message);
  }

  /**
   * Display info message
   */
  static showInfo(message: string): void {
    Logger.info(message);
  }

  /**
   * Display service credentials
   */
  static displayCredentials(service: string, credentials: Record<string, string>): void {
    const content = Object.entries(credentials)
      .map(([key, value]) => `${chalk.bold(key)}: ${value}`)
      .join('\n');
    
    this.showNotice(`${service} Credentials`, content);
  }
}
