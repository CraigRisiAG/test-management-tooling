#!/bin/bash

# Upgrade Functions

upgrade() {
  if [ ! -f backup/settings.env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  confirm "" "      Do you want to do an upgrade?" "n"
  if [[ $? -eq 0 ]]; then
    exit
  fi

  # Execute all patch scripts
  apply_patches

  # IMPORTANT! Increment latest verification to new version
  if [[ ${p2_5} -eq 2 ]]; then
    echo "No need to restart service as nothing was upgraded."
    exit -1
  fi

  echo_warning "Your services needs to restart to finish important updates."
  confirm "" "      Restart now?" "y"
  if [[ $? -eq 1 ]]; then
    down
    start
  fi
}

apply_patches() {
  local patches=(
    "1.1" "1.2" "1.3" "1.4" "1.5" "1.6" "1.7" "1.8" "1.9"
    "2.0" "2.1" "2.3" "2.4" "2.5"
  )

  for patch_version in "${patches[@]}"; do
    patch/${patch_version}.sh
    local result=$?
    
    # Store result in variable named p{version}
    local var_name="p${patch_version//./_}"
    eval "$var_name=$result"
    
    if [[ ${result} -eq 1 ]]; then
      echo "ERROR! ${patch_version} patchset was not applied correctly!"
      exit -1
    fi
  done
}
