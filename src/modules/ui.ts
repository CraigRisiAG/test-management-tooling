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
   * Display Test Management banner
   */
  static printBanner(): void {
    const banner = figlet.textSync('TEST MANAGER', {
      font: 'Standard',
      horizontalLayout: 'default',
    });
    
    console.log(chalk.cyan(banner));
    console.log(chalk.gray('Custom Test Management with Story-Code Traceability v1.0.0\n'));
  }

  /**
   * Display help information
   */
  static showHelp(): void {
    const helpText = `
${chalk.bold('USAGE:')}
  testmgr [COMMAND]

${chalk.bold('COMMANDS:')}
  ${chalk.cyan('init')}          Initialize test management system
  ${chalk.cyan('story')}         Manage user stories (create, list)
  ${chalk.cyan('test')}          Manage tests (link, run)
  ${chalk.cyan('link-code')}     Link code to stories
  ${chalk.cyan('dashboard')}     Generate dashboard with traceability matrix
  ${chalk.cyan('matrix')}        Show traceability matrix
  ${chalk.cyan('gitops')}        Git operations
  ${chalk.cyan('agile')}         Agile board management
  ${chalk.cyan('help')}          Display this help message

${chalk.bold('OPTIONS:')}
  -h, --help        Show help information
  -v, --version     Show version information
  --debug           Enable debug logging
  --data-dir <dir>  Specify data directory

${chalk.bold('EXAMPLES:')}
  testmgr init                 # Initialize in current directory
  testmgr story create         # Create a new user story
  testmgr test link            # Link test to story
  testmgr link-code            # Link code to story
  testmgr dashboard            # Generate HTML dashboard
  testmgr matrix               # Show traceability matrix

${chalk.bold('DOCUMENTATION:')}
  Visit: https://github.com/your-repo/docs
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
