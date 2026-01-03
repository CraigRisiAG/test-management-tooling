#!/bin/bash

# Unit Tests for lib/config.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

# Mock dependencies
confirm() { return ${MOCK_CONFIRM_RESULT:-1}; }

# Source the module under test
source "$PROJECT_ROOT/lib/config.sh"

test_set_global_settings_function_exists() {
    assert_function_exists "set_global_settings" "set_global_settings function should exist"
}

test_enableLayer_function_exists() {
    assert_function_exists "enableLayer" "enableLayer function should exist"
}

test_disableLayer_function_exists() {
    assert_function_exists "disableLayer" "disableLayer function should exist"
}

test_disableLayer_creates_disabled_file() {
    local test_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$test_dir"
    
    disableLayer "$test_dir"
    
    assert_file_exists "$test_dir/.disabled" "disableLayer should create .disabled file"
    
    # Cleanup
    rm -rf "$test_dir"
}

test_enableLayer_removes_disabled_file() {
    local test_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$test_dir"
    echo > "$test_dir/.disabled"
    
    # Mock confirm to return 1 (enable)
    MOCK_CONFIRM_RESULT=1
    enableLayer "$test_dir" "Test message" "y"
    local result=$?
    
    assert_exit_code 1 $result "enableLayer should return 1 when enabled"
    
    if [[ -f "$test_dir/.disabled" ]]; then
        echo "FAILED: .disabled file should be removed"
        rm -rf "$test_dir"
        return 1
    fi
    
    # Cleanup
    rm -rf "$test_dir"
}

test_enableLayer_disables_when_declined() {
    local test_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$test_dir"
    
    # Mock confirm to return 0 (disable)
    MOCK_CONFIRM_RESULT=0
    enableLayer "$test_dir" "Test message" "n"
    local result=$?
    
    assert_exit_code 0 $result "enableLayer should return 0 when disabled"
    assert_file_exists "$test_dir/.disabled" "Should create .disabled file when declined"
    
    # Cleanup
    rm -rf "$test_dir"
}

# Run all tests
test_set_global_settings_function_exists
test_enableLayer_function_exists
test_disableLayer_function_exists
test_disableLayer_creates_disabled_file
test_enableLayer_removes_disabled_file
test_enableLayer_disables_when_declined

echo "All config.sh tests passed!"
