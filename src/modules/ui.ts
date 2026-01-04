import { Logger } from '../utils/logger';
import type figlet from 'figlet';
import type boxen from 'boxen';
import type chalk from 'chalk';

/**
 * UI Module - Display functions
 * Converted from lib/ui.sh
 */
export class UIModule {
  private static depsPromise: Promise<{
    figlet: typeof figlet;
    boxen: typeof boxen;
    chalk: typeof chalk;
  }> | null = null;

  private static async loadDeps() {
    if (!this.depsPromise) {
      this.depsPromise = Promise.all([
        import('figlet'),
        import('boxen'),
        import('chalk'),
      ]).then(([figletMod, boxenMod, chalkMod]) => ({
        figlet: (figletMod as any).default ?? (figletMod as any),
        boxen: (boxenMod as any).default ?? (boxenMod as any),
        chalk: (chalkMod as any).default ?? (chalkMod as any),
      }));
    }
    return this.depsPromise;
  }

  /**
   * Display Test Management banner
   */
  static async printBanner(): Promise<void> {
    const { figlet, chalk } = await this.loadDeps();
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
  static async showHelp(): Promise<void> {
    const { chalk } = await this.loadDeps();
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
  static async showNotice(title: string, content: string): Promise<void> {
    const { boxen } = await this.loadDeps();
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
  static async displayCredentials(service: string, credentials: Record<string, string>): Promise<void> {
    const { chalk } = await this.loadDeps();
    const content = Object.entries(credentials)
        .map(([key, value]) => `${chalk.bold(key)}: ${value}`)
      .join('\n');
    
    await this.showNotice(`${service} Credentials`, content);
  }
}
