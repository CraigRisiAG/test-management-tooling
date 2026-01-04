/**
 * Lifecycle Module - Docker container management
 * Converted from lib/lifecycle.sh
 */
export declare class LifecycleModule {
    private static readonly INFRA_NETWORK;
    /**
     * Start all Zebrunner services
     */
    static start(): Promise<void>;
    /**
     * Stop all services (containers remain)
     */
    static stop(): Promise<void>;
    /**
     * Restart all services
     */
    static restart(): Promise<void>;
    /**
     * Stop and remove containers
     */
    static down(): Promise<void>;
    /**
     * Complete shutdown with volume removal
     */
    static shutdown(): Promise<void>;
    /**
     * Display version information
     */
    static version(): void;
    /**
     * Validate prerequisites
     */
    private static validatePrerequisites;
    /**
     * Display service status
     */
    private static displayServiceStatus;
}
//# sourceMappingURL=lifecycle.d.ts.map