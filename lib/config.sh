#!/bin/bash

# Configuration Management Functions

set_global_settings() {
  # Setup global settings: protocol, hostname and port
  echo "Zebrunner General Settings"
  local is_confirmed=0
  if [[ -z $ZBR_HOSTNAME ]]; then
    ZBR_HOSTNAME=`curl -s ifconfig.me`
  fi

  while [[ $is_confirmed -eq 0 ]]; do
    read -r -p "Protocol [$ZBR_PROTOCOL]: " local_protocol
    if [[ ! -z $local_protocol ]]; then
      ZBR_PROTOCOL=$local_protocol
    fi

    read -r -p "Fully qualified domain name (ip) [$ZBR_HOSTNAME]: " local_hostname
    if [[ ! -z $local_hostname ]]; then
      ZBR_HOSTNAME=$local_hostname
    fi

    read -r -p "Port [$ZBR_PORT]: " local_port
    if [[ ! -z $local_port ]]; then
      ZBR_PORT=$local_port
    fi

    confirm "Zebrunner URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT" "Continue?" "y"
    is_confirmed=$?
  done

  export ZBR_PROTOCOL=$ZBR_PROTOCOL
  export ZBR_HOSTNAME=$ZBR_HOSTNAME
  export ZBR_PORT=$ZBR_PORT
}

enableLayer() {
  local layer=$1
  local message=$2
  local isEnabled=$3

  echo
  confirm "$message" "Enable?" "$isEnabled"
  if [[ $? -eq 1 ]]; then
    # enable component/layer
    if [[ -f $layer/.disabled ]]; then
      rm "$layer"/.disabled
    fi
    return 1
  else
    disableLayer "$layer"
    return 0
  fi
}

disableLayer() {
  # disable component/layer
  echo > "$1"/.disabled
  return 0
}
