"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Logger utility for consistent console output
 */
class Logger {
    static debugEnabled = process.env.DEBUG === 'true';
    static info(message) {
        console.log(chalk_1.default.blue('ℹ'), message);
    }
    static success(message) {
        console.log(chalk_1.default.green('✔'), message);
    }
    static warn(message) {
        console.log(chalk_1.default.yellow('⚠'), message);
    }
    static error(message) {
        console.error(chalk_1.default.red('✖'), message);
    }
    static debug(message) {
        if (this.debugEnabled) {
            console.log(chalk_1.default.gray('🐛'), chalk_1.default.gray(message));
        }
    }
    static log(level, message) {
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
    static banner(text) {
        console.log(chalk_1.default.cyan.bold('\n' + text + '\n'));
    }
    static section(title) {
        console.log('\n' + chalk_1.default.bold.underline(title));
    }
    static table(data) {
        console.table(data);
    }
    static enableDebug() {
        this.debugEnabled = true;
    }
    static disableDebug() {
        this.debugEnabled = false;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map