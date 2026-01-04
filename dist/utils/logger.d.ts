import { LogLevel } from '../types';
/**
 * Logger utility for consistent console output
 */
export declare class Logger {
    private static debugEnabled;
    static info(message: string): void;
    static success(message: string): void;
    static warn(message: string): void;
    static error(message: string): void;
    static debug(message: string): void;
    static log(level: LogLevel, message: string): void;
    static banner(text: string): void;
    static section(title: string): void;
    static table(data: Record<string, string>[]): void;
    static enableDebug(): void;
    static disableDebug(): void;
}
//# sourceMappingURL=logger.d.ts.map