#!/bin/bash

# Unit Tests for lib/setup.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

# Mock all dependencies
print_banner() { :; }
set_global_settings() { :; }
replace() { :; }
set_reporting_settings() { :; }
disableLayer() { :; }
enableLayer() { return 1; }
export_settings() { :; }
confirm() { return 1; }
echo_warning() { :; }
set_aws_storage_settings() { :; }

# Source the module under test
source "$PROJECT_ROOT/lib/setup.sh"

test_setup_function_exists() {
    assert_function_exists "setup" "setup function should exist"
}

test_setup_reporting_function_exists() {
    assert_function_exists "setup_reporting" "setup_reporting function should exist"
}

test_setup_sonarqube_function_exists() {
    assert_function_exists "setup_sonarqube" "setup_sonarqube function should exist"
}

test_setup_jenkins_function_exists() {
    assert_function_exists "setup_jenkins" "setup_jenkins function should exist"
}

test_setup_selenoid_function_exists() {
    assert_function_exists "setup_selenoid" "setup_selenoid function should exist"
}

test_setup_mcloud_function_exists() {
    assert_function_exists "setup_mcloud" "setup_mcloud function should exist"
}

test_configure_integrations_function_exists() {
    assert_function_exists "configure_integrations" "configure_integrations function should exist"
}

test_configure_nginx_routing_function_exists() {
    assert_function_exists "configure_nginx_routing" "configure_nginx_routing function should exist"
}

test_generate_notice_function_exists() {
    assert_function_exists "generate_notice" "generate_notice function should exist"
}

test_generate_notice_creates_file() {
    # Set required environment variables
    export ZBR_PROTOCOL="http"
    export ZBR_HOSTNAME="localhost"
    export ZBR_PORT="80"
    export ZBR_REPORTING_ENABLED=0
    export ZBR_JENKINS_ENABLED=0
    export ZBR_SONARQUBE_ENABLED=0
    export ZBR_SELENOID_ENABLED=0
    export ZBR_MCLOUD_ENABLED=0
    
    # Create temp directory
    local temp_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # Run generate_notice
    generate_notice
    
    # Check if NOTICE.txt was created
    assert_file_exists "NOTICE.txt" "generate_notice should create NOTICE.txt"
    
    # Check content
    local content=$(cat NOTICE.txt)
    assert_contains "$content" "ZEBRUNNER URL" "Notice should contain URL"
    assert_contains "$content" "Apache License" "Notice should contain license info"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Run all tests
test_setup_function_exists
test_setup_reporting_function_exists
test_setup_sonarqube_function_exists
test_setup_jenkins_function_exists
test_setup_selenoid_function_exists
test_setup_mcloud_function_exists
test_configure_integrations_function_exists
test_configure_nginx_routing_function_exists
test_generate_notice_function_exists
test_generate_notice_creates_file

echo "All setup.sh tests passed!"
