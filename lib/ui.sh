#!/bin/bash

# UI/Display Functions

print_banner() {
  echo "
███████╗███████╗██████╗ ██████╗ ██╗   ██╗███╗   ██╗███╗   ██╗███████╗██████╗      ██████╗███████╗
╚══███╔╝██╔════╝██╔══██╗██╔══██╗██║   ██║████╗  ██║████╗  ██║██╔════╝██╔══██╗    ██╔════╝██╔════╝
  ███╔╝ █████╗  ██████╔╝██████╔╝██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██████╔╝    ██║     █████╗  
 ███╔╝  ██╔══╝  ██╔══██╗██╔══██╗██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██╔══██╗    ██║     ██╔══╝  
███████╗███████╗██████╔╝██║  ██║╚██████╔╝██║ ╚████║██║ ╚████║███████╗██║  ██║    ╚██████╗███████╗
╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝     ╚═════╝╚══════╝
"
}

echo_help() {
  echo "
    Usage: ./zebrunner.sh [option]
    Flags:
        --help | -h    Print help
    Arguments:
        setup [-d]     Setup Zebrunner Community Edition ('-d' - debug mode)
        start          Start container
        stop           Stop and keep container
        restart        Restart container
        down           Stop and remove container
        shutdown       Stop and remove container, clear volumes
        backup         Backup container
        restore        Restore container
        upgrade        Upgrade to the latest version of Zebrunner Community Edition
        version        Version of components"
    echo_telegram
    exit 0
}
