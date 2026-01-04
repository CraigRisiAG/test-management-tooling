/**
 * UI Module - Display functions
 * Converted from lib/ui.sh
 */
export declare class UIModule {
    /**
     * Display Zebrunner banner
     */
    static printBanner(): void;
    /**
     * Display help information
     */
    static showHelp(): void;
    /**
     * Display notice/information box
     */
    static showNotice(title: string, content: string): void;
    /**
     * Display success message
     */
    static showSuccess(message: string): void;
    /**
     * Display error message
     */
    static showError(message: string): void;
    /**
     * Display warning message
     */
    static showWarning(message: string): void;
    /**
     * Display info message
     */
    static showInfo(message: string): void;
    /**
     * Display service credentials
     */
    static displayCredentials(service: string, credentials: Record<string, string>): void;
}
//# sourceMappingURL=ui.d.ts.map