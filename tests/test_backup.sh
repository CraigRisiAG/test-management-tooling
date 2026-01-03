#!/bin/bash

# Unit Tests for lib/backup.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

# Mock dependencies
print_banner() { :; }
echo_warning() { :; }
echo_telegram() { :; }
confirm() { return ${MOCK_CONFIRM_RESULT:-0}; }
stop() { :; }
start() { :; }
down() { :; }

# Source the module under test
source "$PROJECT_ROOT/lib/backup.sh"

test_backup_function_exists() {
    assert_function_exists "backup" "backup function should exist"
}

test_restore_function_exists() {
    assert_function_exists "restore" "restore function should exist"
}

test_backup_requires_env_file() {
    # Create temp directory without .env
    local temp_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # This should fail
    (backup 2>&1) && exit_code=0 || exit_code=$?
    
    assert_not_equals 0 $exit_code "backup should fail without .env file"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

test_restore_requires_backup_file() {
    # Create temp directory with .env but no backup
    local temp_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$temp_dir/backup"
    touch "$temp_dir/.env"
    cd "$temp_dir"
    
    # This should fail
    (restore 2>&1) && exit_code=0 || exit_code=$?
    
    assert_not_equals 0 $exit_code "restore should fail without backup file"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Run all tests
test_backup_function_exists
test_restore_function_exists
test_backup_requires_env_file
test_restore_requires_backup_file

echo "All backup.sh tests passed!"
