#!/bin/bash

# Backup and Restore Functions

backup() {
  if [ ! -f .env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  confirm "" "      Your services will be stopped. Do you want to do a backup now?" "n"
  if [[ $? -eq 0 ]]; then
    exit
  fi

  print_banner

  stop

  cp .env .env.bak
  cp ./nginx/conf.d/default.conf ./nginx/conf.d/default.conf.bak
  cp backup/settings.env backup/settings.env.bak
  if [[ -f reporting/database/reporting/sql/db-jenkins-integration.sql ]]; then
    cp reporting/database/reporting/sql/db-jenkins-integration.sql reporting/database/reporting/sql/db-jenkins-integration.sql.bak
  fi
  if [[ -f reporting/database/reporting/sql/db-mcloud-integration.sql ]]; then
    cp reporting/database/reporting/sql/db-mcloud-integration.sql reporting/database/reporting/sql/db-mcloud-integration.sql.bak
  fi
  if [[ -f reporting/database/reporting/sql/db-selenium-integration.sql ]]; then
    cp reporting/database/reporting/sql/db-selenium-integration.sql reporting/database/reporting/sql/db-selenium-integration.sql.bak
  fi

  jenkins/zebrunner.sh backup
  reporting/zebrunner.sh backup
  sonarqube/zebrunner.sh backup
  mcloud/zebrunner.sh backup
  selenoid/zebrunner.sh backup

  echo_warning "Your services needs to be started after backup."
  confirm "" "      Start now?" "y"
  if [[ $? -eq 1 ]]; then
    start
  fi
}

restore() {
  if [ ! -f .env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  if [ ! -f backup/settings.env.bak ]; then
    echo_warning "You have to backup something in advance using: ./zebrunner.sh backup"
    echo_telegram
    exit -1
  fi

  echo "      Your services will be stopped and current data might be lost."
  confirm "" "      Do you want to do a restore to \"`date -r backup/settings.env.bak`\" state?" "n"
  if [[ $? -eq 0 ]]; then
    exit
  fi

  print_banner

  stop
  cp .env.bak .env
  cp ./nginx/conf.d/default.conf.bak ./nginx/conf.d/default.conf
  cp backup/settings.env.bak backup/settings.env
  if [[ -f reporting/database/reporting/sql/db-jenkins-integration.sql.bak ]]; then
    cp reporting/database/reporting/sql/db-jenkins-integration.sql.bak reporting/database/reporting/sql/db-jenkins-integration.sql
  fi
  if [[ -f reporting/database/reporting/sql/db-mcloud-integration.sql.bak ]]; then
    cp reporting/database/reporting/sql/db-mcloud-integration.sql.bak reporting/database/reporting/sql/db-mcloud-integration.sql
  fi
  if [[ -f reporting/database/reporting/sql/db-selenium-integration.sql.bak ]]; then
    cp reporting/database/reporting/sql/db-selenium-integration.sql.bak reporting/database/reporting/sql/db-selenium-integration.sql
  fi

  jenkins/zebrunner.sh restore
  reporting/zebrunner.sh restore
  sonarqube/zebrunner.sh restore
  mcloud/zebrunner.sh restore
  selenoid/zebrunner.sh restore
  down

  echo_warning "Your services needs to be started after restore."
  confirm "" "      Start now?" "y"
  if [[ $? -eq 1 ]]; then
    start
  fi
}
