#!/bin/bash

# Setup and Configuration Functions

setup() {
  print_banner

  if [ "$1" == "-d" ]; then
    set -x
  fi

  # load default interactive installer settings
  # shellcheck disable=SC1091
  source backup/settings.env.original

  # load ./backup/settings.env if exist to declare ZBR* vars from previous run!
  if [[ -f backup/settings.env ]]; then
    source backup/settings.env
  fi

  export ZBR_INSTALLER=1
  export ZBR_VERSION=2.5
  set_global_settings

  cp .env.original .env
  replace .env "ZBR_PORT=80" "ZBR_PORT=${ZBR_PORT}"
  cp nginx/conf.d/default.conf.original nginx/conf.d/default.conf

  replace ./nginx/conf.d/default.conf "server_name localhost" "server_name '$ZBR_HOSTNAME'"
  # declare ssl protocol for NGiNX default config
  if [[ "$ZBR_PROTOCOL" == "https" ]]; then
    replace ./nginx/conf.d/default.conf "listen 80" "listen 80 ssl"

    # uncomment default ssl settings
    replace ./nginx/conf.d/default.conf "#    ssl_" "    ssl_"

    # configure valid sub-modules rules
    replace ./nginx/conf.d/default.conf "http://jenkins-master:8080;" "https://jenkins-master:8443;"
    replace ./nginx/conf.d/default.conf "upstream_sonar http://127.0.0.1:80;" "upstream_sonar https://127.0.0.1:80;"
    replace ./nginx/conf.d/default.conf "upstream_mcloud http://127.0.0.1:80;" "upstream_mcloud https://127.0.0.1:80;"
    replace ./nginx/conf.d/default.conf "upstream_stf http://stf-proxy:80;" "upstream_stf https://stf-proxy:80;"
  fi

  # Setup reporting component
  setup_reporting

  # Setup optional components
  setup_sonarqube
  setup_jenkins
  setup_selenoid
  setup_mcloud

  # Configure integrations
  configure_integrations

  # Configure nginx routing
  configure_nginx_routing

  # Export settings and generate notice
  export_settings
  generate_notice

  # Start services if requested
  if [[ "$ZBR_PROTOCOL" == "https" ]]; then
    echo_warning "Replace self-signed ssl.crt and ssl.key in ./nginx/ssl onto valid ones!"
  fi

  echo_warning "Your services needs to be started after setup."
  confirm "" "      Start now?" "y"
  export start_services=$?
  echo
  echo

  if [[ $ZBR_SELENOID_ENABLED -eq 1 ]]; then
     selenoid/zebrunner.sh setup
  fi

  if [[ $start_services -eq 1 ]]; then
    start
  fi
}

setup_reporting() {
  # Reporting is obligatory component now. But to be able to disable it we can register REPORTING_DISABLED=1 env variable before setup
  if [[ $ZBR_REPORTING_ENABLED -eq 1 && -z $REPORTING_DISABLED ]]; then
    # 411 There is ".disabled" present in minio-storage after setup all components
    rm -f reporting/.disabled
    rm -f reporting/minio-storage/.disabled

    set_reporting_settings
    reporting/zebrunner.sh setup
  else
    # explicitly disable reporting and minio as it was disabled by engineer via REPORTING_DISABLED env var
    export ZBR_REPORTING_ENABLED=0
    disableLayer "reporting"
    disableLayer "reporting/minio-storage"
  fi
}

setup_sonarqube() {
  enableLayer "sonarqube" "Use embedded SonarQube to organize static code analysis and guiding your team?" "$ZBR_SONARQUBE_ENABLED"
  export ZBR_SONARQUBE_ENABLED=$?

  if [[ $ZBR_SONARQUBE_ENABLED -eq 1 ]]; then
    sonarqube/zebrunner.sh setup
    export ZBR_SONAR_URL=$ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/sonarqube
  fi
}

setup_jenkins() {
  enableLayer "jenkins" "Use embedded Jenkins as recommended CI tool?" "$ZBR_JENKINS_ENABLED"
  export ZBR_JENKINS_ENABLED=$?

  if [[ $ZBR_JENKINS_ENABLED -eq 1 ]]; then
    jenkins/zebrunner.sh setup
  fi
}

setup_selenoid() {
  enableLayer "selenoid" "Use embedded Web Selenium Hub for testing on chrome, firefox, opera and MicrosoftEdge browsers?" "$ZBR_SELENOID_ENABLED"
  export ZBR_SELENOID_ENABLED=$?
}

setup_mcloud() {
  enableLayer "mcloud" "Use embedded Mobile Device Farm and Selenium/Appium Hub for testing on Android, iOS, AppleTV etc devices?" "$ZBR_MCLOUD_ENABLED"
  export ZBR_MCLOUD_ENABLED=$?

  if [[ $ZBR_MCLOUD_ENABLED -eq 1 && $ZBR_REPORTING_ENABLED -eq 0 ]] || [[ $ZBR_SELENOID_ENABLED -eq 1 && $ZBR_REPORTING_ENABLED -eq 0 ]]; then
    set_aws_storage_settings
  fi

  if [[ $ZBR_MCLOUD_ENABLED -eq 1 ]]; then
    mcloud/zebrunner.sh setup
  fi
}

configure_integrations() {
  if [[ $ZBR_JENKINS_ENABLED -eq 1 && $ZBR_REPORTING_ENABLED -eq 1 ]]; then
    # update reporting-jenkins integration vars
    replace reporting/configuration/reporting-service/variables.env "JENKINS_ENABLED=false" "JENKINS_ENABLED=true"
    replace reporting/configuration/reporting-service/variables.env "JENKINS_URL=" "JENKINS_URL=$ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/jenkins"
  fi
}

configure_nginx_routing() {
  # finish with NGiNX default tool selection
  if [[ $ZBR_REPORTING_ENABLED -eq 1 ]]; then
    replace ./nginx/conf.d/default.conf "default-proxy-server" "zebrunner-proxy:80"
    replace ./nginx/conf.d/default.conf "default-proxy-host" "zebrunner-proxy"
  elif [[ $ZBR_MCLOUD_ENABLED -eq 1 ]]; then
    replace ./nginx/conf.d/default.conf "default-proxy-server" "stf-proxy:80"
    replace ./nginx/conf.d/default.conf "default-proxy-host" "stf-proxy"
  elif [[ $ZBR_JENKINS_ENABLED -eq 1 ]]; then
    replace ./nginx/conf.d/default.conf 'set $upstream_default default-proxy-server;' ""
    replace ./nginx/conf.d/default.conf "proxy_set_header Host default-proxy-host;" ""
    replace ./nginx/conf.d/default.conf 'proxy_pass http://$upstream_default;' "rewrite / /jenkins;"
  elif [[ $ZBR_SONARQUBE_ENABLED -eq 1 ]]; then
    replace ./nginx/conf.d/default.conf 'set $upstream_default default-proxy-server;' ""
    replace ./nginx/conf.d/default.conf "proxy_set_header Host default-proxy-host;" ""
    replace ./nginx/conf.d/default.conf 'proxy_pass http://$upstream_default;' "rewrite / /sonarqube;"
  else
    replace ./nginx/conf.d/default.conf 'proxy_pass http://$upstream_default;' "root   /usr/share/nginx/html;"
  fi
}

generate_notice() {
  echo
  echo "Copy and save auto-generated crendentials. Detailes can be found also in NOTICE.txt"
  echo

  notice=NOTICE.txt
  echo "NOTICES AND INFORMATION" > $notice
  echo >> $notice
  echo >> $notice

  echo "ZEBRUNNER URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT" | tee -a $notice
  echo | tee -a $notice

  if [[ $ZBR_REPORTING_ENABLED -eq 1 ]]; then
    echo "REPORTING SERVICE CREDENTIALS:" | tee -a $notice
    echo "USER: admin/changeit" | tee -a $notice
    echo "IAM POSTGRES: postgres/$ZBR_IAM_POSTGRES_PASSWORD" | tee -a $notice
    echo "REPORTING POSTGRES: postgres/$ZBR_POSTGRES_PASSWORD" | tee -a $notice
    echo "RABBITMQ: $ZBR_RABBITMQ_USER/$ZBR_RABBITMQ_PASSWORD" | tee -a $notice
    echo "REDIS: $ZBR_REDIS_PASSWORD" | tee -a $notice
    echo | tee -a $notice

    if [[ ZBR_SMTP_ENABLED -eq 1 ]]; then
      echo "REPORTING SMTP INTEGRATIONS:" | tee -a $notice
      echo "SMTP HOST: $ZBR_SMTP_HOST:$ZBR_SMTP_PORT" | tee -a $notice
      echo "EMAIL: $ZBR_SMTP_EMAIL" | tee -a $notice
      echo "USER: $ZBR_SMTP_USER/$ZBR_SMTP_PASSWORD" | tee -a $notice
      echo | tee -a $notice
    fi
  fi

  if [[ $ZBR_JENKINS_ENABLED -eq 1 ]]; then
    echo "JENKINS URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/jenkins" | tee -a $notice
    echo "JENKINS USER: admin/changeit" | tee -a $notice
    echo | tee -a $notice
  fi

  if [[ $ZBR_SONARQUBE_ENABLED -eq 1 ]]; then
    echo "SONARQUBE URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/sonarqube" | tee -a $notice
    echo "SONARQUBE USER: admin/admin" | tee -a $notice
    echo | tee -a $notice
  fi

  if [[ $ZBR_SELENOID_ENABLED -eq 1 ]]; then
    echo "SELENIUM HUB URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/selenoid/wd/hub" | tee -a $notice
    echo | tee -a $notice
  fi

  if [[ $ZBR_MCLOUD_ENABLED -eq 1 ]]; then
    echo "STF URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/stf" | tee -a $notice
    echo "APPIUM HUB URL: $ZBR_PROTOCOL://$ZBR_HOSTNAME:$ZBR_PORT/mcloud/wd/hub" | tee -a $notice
    echo | tee -a $notice
  fi

  # append copyright and licensing info
  echo >> $notice
  echo "Copyright 2018-2021 ZEBRUNNER" >> $notice
  echo >> $notice

  echo "Licensed under the Apache License, Version 2.0 (the \"License\");" >> $notice
  echo "you may not use this file except in compliance with the License." >> $notice
  echo "You may obtain a copy of the License at" >> $notice
  echo >> $notice

  echo "http://www.apache.org/licenses/LICENSE-2.0" >> $notice
  echo >> $notice

  echo "Unless required by applicable law or agreed to in writing, software" >> $notice
  echo "distributed under the License is distributed on an \"AS IS\" BASIS," >> $notice
  echo "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied." >> $notice
  echo "See the License for the specific language governing permissions and" >> $notice
  echo "limitations under the License." >> $notice
}
