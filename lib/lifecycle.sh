#!/bin/bash

# Service Lifecycle Management Functions

start() {
  if [ ! -f .env ]; then
    # need proceed with setup steps in advance!
    setup
    exit -1
  fi

  source backup/settings.env
  if [[ -z ${ZBR_VERSION} ]]; then
    ZBR_VERSION=1.0
  fi
  ACTUAL_VERSION=${ZBR_VERSION}

  source .env
  DESIRED_VERSION=${ZBR_VERSION}

  if [[ "${ACTUAL_VERSION}" < "${DESIRED_VERSION}" ]]; then
    echo_warning "You have to upgrade services in advance using: ./zebrunner.sh upgrade"
    echo_telegram
    exit -1
  fi

  print_banner

  # create infra network only if not exist
  docker network inspect infra >/dev/null 2>&1 || docker network create infra

  #-------------- START EVERYTHING ------------------------------
  selenoid/zebrunner.sh start
  mcloud/zebrunner.sh start
  jenkins/zebrunner.sh start
  reporting/zebrunner.sh start
  sonarqube/zebrunner.sh start

  docker compose up -d
}

stop() {
  if [ ! -f .env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  jenkins/zebrunner.sh stop
  reporting/zebrunner.sh stop
  sonarqube/zebrunner.sh stop
  mcloud/zebrunner.sh stop
  selenoid/zebrunner.sh stop
  docker compose stop
}

restart() {
  if [ ! -f .env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  down
  start
}

down() {
  if [ ! -f .env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  jenkins/zebrunner.sh down
  reporting/zebrunner.sh down
  sonarqube/zebrunner.sh down
  mcloud/zebrunner.sh down
  selenoid/zebrunner.sh down
  docker compose down
}

shutdown() {
  if [ ! -f backup/settings.env ]; then
    echo_warning "Unable to erase as nothing is configured!"
    echo_telegram
    exit -1
  fi

  echo_warning "Shutdown will erase all settings and data for \"${BASEDIR}\"!"
  confirm "" "      Do you want to continue?" "n"
  if [[ $? -eq 0 ]]; then
    exit
  fi

  export SHUTDOWN_CONFIRMED=1

  print_banner

  jenkins/zebrunner.sh shutdown
  reporting/zebrunner.sh shutdown
  sonarqube/zebrunner.sh shutdown
  mcloud/zebrunner.sh shutdown
  selenoid/zebrunner.sh shutdown
  docker compose down -v

  rm -f NOTICE.txt
  rm -f .env
  rm -f nginx/conf.d/default.conf
  rm -f backup/settings.env

  rm -f reporting/database/reporting/sql/db-jenkins-integration.sql
  rm -f reporting/database/reporting/sql/db-mcloud-integration.sql
  rm -f reporting/database/reporting/sql/db-selenium-integration.sql
}

version() {
  if [ ! -f .env ]; then
    echo_warning "You have to setup services in advance using: ./zebrunner.sh setup"
    echo_telegram
    exit -1
  fi

  source backup/settings.env

  echo "
    zebrunner: ${ZBR_VERSION}
    $(jenkins/zebrunner.sh version)
    $(mcloud/zebrunner.sh version)
    $(reporting/zebrunner.sh version)
    $(selenoid/zebrunner.sh version)
    $(sonarqube/zebrunner.sh version)"
}
