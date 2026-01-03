# Zebrunner.sh Modular Refactoring

## Overview

The zebrunner.sh script has been refactored into a modular architecture for better maintainability, readability, and separation of concerns.

## Structure

```
test-management-tooling/
├── zebrunner.sh              # Main entry point (slim orchestrator)
└── lib/                      # Modular function libraries
    ├── ui.sh                 # UI/Display functions
    ├── config.sh             # Configuration management
    ├── setup.sh              # Setup and initialization
    ├── lifecycle.sh          # Service lifecycle (start/stop/restart)
    ├── backup.sh             # Backup and restore operations
    └── upgrade.sh            # Upgrade and patch management
```

## Module Responsibilities

### 📄 zebrunner.sh (Main Entry Point - 20 lines)
- Loads all module libraries
- Routes commands to appropriate functions
- Minimal logic, maximum clarity

### 🎨 lib/ui.sh (UI/Display)
**Functions:**
- `print_banner()` - Displays Zebrunner ASCII art banner
- `echo_help()` - Shows usage instructions

**Purpose:** All user interface and display logic

### ⚙️ lib/config.sh (Configuration Management)
**Functions:**
- `set_global_settings()` - Configure protocol, hostname, port
- `enableLayer()` - Enable a component/service layer
- `disableLayer()` - Disable a component/service layer

**Purpose:** All configuration and settings management

### 🛠️ lib/setup.sh (Setup and Installation)
**Functions:**
- `setup()` - Main setup orchestrator
- `setup_reporting()` - Configure reporting service
- `setup_sonarqube()` - Configure SonarQube
- `setup_jenkins()` - Configure Jenkins
- `setup_selenoid()` - Configure Selenoid (web testing)
- `setup_mcloud()` - Configure MCloud (mobile testing)
- `configure_integrations()` - Wire up service integrations
- `configure_nginx_routing()` - Set up reverse proxy routing
- `generate_notice()` - Create NOTICE.txt with credentials

**Purpose:** All setup, initialization, and configuration logic

### 🔄 lib/lifecycle.sh (Service Management)
**Functions:**
- `start()` - Start all services
- `stop()` - Stop all services (keep containers)
- `restart()` - Restart all services
- `down()` - Stop and remove containers
- `shutdown()` - Complete teardown (removes volumes)
- `version()` - Display component versions

**Purpose:** All Docker container lifecycle management

### 💾 lib/backup.sh (Data Operations)
**Functions:**
- `backup()` - Backup all services and data
- `restore()` - Restore from previous backup

**Purpose:** Backup and disaster recovery operations

### ⬆️ lib/upgrade.sh (Upgrade Management)
**Functions:**
- `upgrade()` - Execute upgrade patches
- `apply_patches()` - Apply version patches (1.1 → 2.5)

**Purpose:** Version upgrades and patch management

## Benefits

### ✅ Before Refactoring
```bash
# Single monolithic file: 693 lines
zebrunner.sh:
  - All functions mixed together
  - Hard to navigate
  - Difficult to maintain
  - No separation of concerns
```

### ✨ After Refactoring
```bash
# Main file: ~20 lines (slim orchestrator)
zebrunner.sh          # Entry point
lib/ui.sh             # 29 lines  - UI logic
lib/config.sh         # 63 lines  - Configuration
lib/setup.sh          # 281 lines - Setup logic
lib/lifecycle.sh      # 134 lines - Service management
lib/backup.sh         # 91 lines  - Backup operations
lib/upgrade.sh        # 38 lines  - Upgrade logic

Total: ~636 lines (split into focused modules)
```

## Usage (Unchanged)

The command-line interface remains exactly the same:

```bash
# Setup
./zebrunner.sh setup
./zebrunner.sh setup -d     # Debug mode

# Lifecycle
./zebrunner.sh start
./zebrunner.sh stop
./zebrunner.sh restart
./zebrunner.sh down
./zebrunner.sh shutdown

# Data operations
./zebrunner.sh backup
./zebrunner.sh restore

# Maintenance
./zebrunner.sh upgrade
./zebrunner.sh version

# Help
./zebrunner.sh --help
./zebrunner.sh -h
```

## Developer Guide

### Adding New Functionality

**1. Identify the appropriate module:**
- UI/Display → `lib/ui.sh`
- Configuration → `lib/config.sh`
- Setup logic → `lib/setup.sh`
- Service lifecycle → `lib/lifecycle.sh`
- Backup/Restore → `lib/backup.sh`
- Upgrades → `lib/upgrade.sh`

**2. Add function to module:**
```bash
# In lib/setup.sh (example)
setup_new_service() {
  enableLayer "new-service" "Enable new service?" "$ZBR_NEW_SERVICE_ENABLED"
  export ZBR_NEW_SERVICE_ENABLED=$?
  
  if [[ $ZBR_NEW_SERVICE_ENABLED -eq 1 ]]; then
    new-service/zebrunner.sh setup
  fi
}
```

**3. Call from appropriate orchestrator:**
```bash
# In setup() function within lib/setup.sh
setup() {
  # ... existing setup steps ...
  setup_new_service  # Add your new function
  # ... remaining setup steps ...
}
```

### Module Dependencies

All modules depend on:
- `patch/utility.sh` - Utility functions (replace, confirm, echo_warning, etc.)
- `reporting/patch/settings.sh` - Reporting service settings
- Environment variables from `backup/settings.env` and `.env`

## Testing

No changes to testing workflow:

```bash
# Full setup test
./zebrunner.sh setup

# Individual service tests
./zebrunner.sh start
./zebrunner.sh version
./zebrunner.sh stop
```

## Migration Notes

### For Existing Installations
- **No migration needed** - The refactored script is fully backward compatible
- All commands work identically
- All configuration files unchanged
- All data preserved

### For Custom Modifications
If you have customized zebrunner.sh:
1. Identify which module(s) your changes belong to
2. Move changes to appropriate `lib/*.sh` file
3. Test thoroughly before deploying

## Architecture Benefits

1. **Separation of Concerns** - Each module has single responsibility
2. **Easier Maintenance** - Changes isolated to specific modules
3. **Better Readability** - ~20-300 lines per file vs 693 lines
4. **Reusability** - Functions can be sourced independently
5. **Testing** - Can test individual modules in isolation
6. **Team Collaboration** - Multiple developers can work on different modules
7. **Documentation** - Each module is self-documenting by name and purpose

## Future Enhancements

Potential next steps:
- Add unit tests for individual modules
- Create API module for external integrations
- Add logging module for centralized log management
- Create monitoring module for health checks
- Add rollback module for upgrade failures

## Questions?

For questions or issues with the refactored structure:
- Review this README
- Check individual module files for function documentation
- Use `./zebrunner.sh --help` for command reference

---

**Refactored:** January 3, 2026
**Backward Compatible:** Yes
**Breaking Changes:** None
