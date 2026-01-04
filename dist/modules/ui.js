"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIModule = void 0;
const figlet_1 = __importDefault(require("figlet"));
const boxen_1 = __importDefault(require("boxen"));
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
/**
 * UI Module - Display functions
 * Converted from lib/ui.sh
 */
class UIModule {
    /**
     * Display Zebrunner banner
     */
    static printBanner() {
        const banner = figlet_1.default.textSync('ZEBRUNNER', {
            font: 'Standard',
            horizontalLayout: 'default',
        });
        console.log(chalk_1.default.cyan(banner));
        console.log(chalk_1.default.gray('Test Management Platform v2.6.0\n'));
    }
    /**
     * Display help information
     */
    static showHelp() {
        const helpText = `
${chalk_1.default.bold('USAGE:')}
  zebrunner [COMMAND]

${chalk_1.default.bold('COMMANDS:')}
  ${chalk_1.default.cyan('setup')}        Setup Zebrunner platform and configure services
  ${chalk_1.default.cyan('start')}        Start all Zebrunner services
  ${chalk_1.default.cyan('stop')}         Stop all services (containers remain)
  ${chalk_1.default.cyan('restart')}      Restart all services
  ${chalk_1.default.cyan('down')}         Stop and remove all containers
  ${chalk_1.default.cyan('shutdown')}     Shutdown platform and remove volumes
  ${chalk_1.default.cyan('backup')}       Backup platform data and configuration
  ${chalk_1.default.cyan('restore')}      Restore platform from backup
  ${chalk_1.default.cyan('upgrade')}      Upgrade platform to latest version
  ${chalk_1.default.cyan('version')}      Display service versions
  ${chalk_1.default.cyan('enable')}       Enable a service layer
  ${chalk_1.default.cyan('disable')}      Disable a service layer
  ${chalk_1.default.cyan('help')}         Display this help message

${chalk_1.default.bold('OPTIONS:')}
  -h, --help        Show help information
  -v, --version     Show version information
  --debug           Enable debug logging

${chalk_1.default.bold('EXAMPLES:')}
  zebrunner setup              # Interactive setup
  zebrunner start              # Start all services
  zebrunner backup             # Backup configuration and data
  zebrunner enable reporting   # Enable reporting service
  zebrunner disable mcloud     # Disable mcloud service

${chalk_1.default.bold('DOCUMENTATION:')}
  Visit: https://zebrunner.com/documentation
`;
        console.log(helpText);
    }
    /**
     * Display notice/information box
     */
    static showNotice(title, content) {
        const box = (0, boxen_1.default)(content, {
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
    static showSuccess(message) {
        logger_1.Logger.success(message);
    }
    /**
     * Display error message
     */
    static showError(message) {
        logger_1.Logger.error(message);
    }
    /**
     * Display warning message
     */
    static showWarning(message) {
        logger_1.Logger.warn(message);
    }
    /**
     * Display info message
     */
    static showInfo(message) {
        logger_1.Logger.info(message);
    }
    /**
     * Display service credentials
     */
    static displayCredentials(service, credentials) {
        const content = Object.entries(credentials)
            .map(([key, value]) => `${chalk_1.default.bold(key)}: ${value}`)
            .join('\n');
        this.showNotice(`${service} Credentials`, content);
    }
}
exports.UIModule = UIModule;
//# sourceMappingURL=ui.js.map