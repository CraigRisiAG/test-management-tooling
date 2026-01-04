"use strict";
/**
 * Zebrunner Platform - TypeScript Entry Point
 *
 * This module exports all core functionality for programmatic usage
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.ShellExecutor = exports.Logger = exports.AgileModule = exports.RepositoryViewerModule = exports.GitOpsModule = exports.LifecycleModule = exports.ConfigModule = exports.UIModule = void 0;
// Modules
var ui_1 = require("./modules/ui");
Object.defineProperty(exports, "UIModule", { enumerable: true, get: function () { return ui_1.UIModule; } });
var config_1 = require("./modules/config");
Object.defineProperty(exports, "ConfigModule", { enumerable: true, get: function () { return config_1.ConfigModule; } });
var lifecycle_1 = require("./modules/lifecycle");
Object.defineProperty(exports, "LifecycleModule", { enumerable: true, get: function () { return lifecycle_1.LifecycleModule; } });
var gitops_1 = require("./modules/gitops");
Object.defineProperty(exports, "GitOpsModule", { enumerable: true, get: function () { return gitops_1.GitOpsModule; } });
var repository_viewer_1 = require("./modules/repository-viewer");
Object.defineProperty(exports, "RepositoryViewerModule", { enumerable: true, get: function () { return repository_viewer_1.RepositoryViewerModule; } });
var agile_1 = require("./modules/agile");
Object.defineProperty(exports, "AgileModule", { enumerable: true, get: function () { return agile_1.AgileModule; } });
// Utilities
var logger_1 = require("./utils/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
var shell_1 = require("./utils/shell");
Object.defineProperty(exports, "ShellExecutor", { enumerable: true, get: function () { return shell_1.ShellExecutor; } });
// Types
__exportStar(require("./types"), exports);
// Version
exports.VERSION = '2.6.0';
//# sourceMappingURL=index.js.map