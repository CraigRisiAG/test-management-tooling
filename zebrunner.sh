#!/bin/bash

# Zebrunner Community Edition - Modular Entry Point
# Copyright 2018-2021 ZEBRUNNER

# Set base directory
BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${BASEDIR}" || exit

# Load utility functions
# shellcheck disable=SC1091
source patch/utility.sh
source reporting/patch/settings.sh

# Load modular functions
source lib/ui.sh
source lib/config.sh
source lib/setup.sh
source lib/lifecycle.sh
source lib/backup.sh
source lib/upgrade.sh

# Main command routing
case "$1" in
    setup)
        setup "$2"
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    down)
        down
        ;;
    shutdown)
        shutdown
        ;;
    backup)
        backup
        ;;
    restore)
        restore
        ;;
    upgrade)
        upgrade
        ;;
    version)
        version
        ;;
    --help|-h)
        echo_help
        ;;
    *)
        echo_help
        exit 1
        ;;
esac

