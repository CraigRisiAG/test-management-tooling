#!/bin/bash

# Unit Tests for lib/upgrade.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

# Mock dependencies
echo_warning() { :; }
echo_telegram() { :; }
confirm() { return ${MOCK_CONFIRM_RESULT:-0}; }
down() { :; }
start() { :; }

# Source the module under test
source "$PROJECT_ROOT/lib/upgrade.sh"

test_upgrade_function_exists() {
    assert_function_exists "upgrade" "upgrade function should exist"
}

test_apply_patches_function_exists() {
    assert_function_exists "apply_patches" "apply_patches function should exist"
}

test_upgrade_requires_settings_file() {
    # Create temp directory without settings
    local temp_dir="/tmp/zebrunner_test_$$"
    mkdir -p "$temp_dir/backup"
    cd "$temp_dir"
    
    # This should fail
    (upgrade 2>&1) && exit_code=0 || exit_code=$?
    
    assert_not_equals 0 $exit_code "upgrade should fail without settings.env"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Run all tests
test_upgrade_function_exists
test_apply_patches_function_exists
test_upgrade_requires_settings_file

echo "All upgrade.sh tests passed!"
