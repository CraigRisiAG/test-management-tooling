#!/bin/bash

# Unit Tests for lib/lifecycle.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

# Mock dependencies
print_banner() { :; }
echo_warning() { :; }
echo_telegram() { :; }
confirm() { return ${MOCK_CONFIRM_RESULT:-0}; }
setup() { :; }

# Source the module under test
source "$PROJECT_ROOT/lib/lifecycle.sh"

test_start_function_exists() {
    assert_function_exists "start" "start function should exist"
}

test_stop_function_exists() {
    assert_function_exists "stop" "stop function should exist"
}

test_restart_function_exists() {
    assert_function_exists "restart" "restart function should exist"
}

test_down_function_exists() {
    assert_function_exists "down" "down function should exist"
}

test_shutdown_function_exists() {
    assert_function_exists "shutdown" "shutdown function should exist"
}

test_version_function_exists() {
    assert_function_exists "version" "version function should exist"
}

test_version_requires_env_file() {
    # Create temp directory without .env
    local temp_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # This should fail and exit, capture exit code
    (version 2>&1) && exit_code=0 || exit_code=$?
    
    assert_not_equals 0 $exit_code "version should fail without .env file"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

test_shutdown_requires_settings_file() {
    # Create temp directory without settings
    local temp_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$temp_dir/backup"
    cd "$temp_dir"
    
    # This should fail and exit
    (shutdown 2>&1) && exit_code=0 || exit_code=$?
    
    assert_not_equals 0 $exit_code "shutdown should fail without settings.env"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Run all tests
test_start_function_exists
test_stop_function_exists
test_restart_function_exists
test_down_function_exists
test_shutdown_function_exists
test_version_function_exists
test_version_requires_env_file
test_shutdown_requires_settings_file

echo "All lifecycle.sh tests passed!"
