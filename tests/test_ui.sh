#!/bin/bash

# Unit Tests for lib/ui.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

# Mock dependencies
echo_telegram() { :; }

# Source the module under test
source "$PROJECT_ROOT/lib/ui.sh"

test_print_banner_function_exists() {
    assert_function_exists "print_banner" "print_banner function should exist"
}

test_print_banner_outputs_text() {
    local output=$(print_banner)
    assert_contains "$output" "ZEBRUNNER" "Banner should contain ZEBRUNNER text"
}

test_echo_help_function_exists() {
    assert_function_exists "echo_help" "echo_help function should exist"
}

test_echo_help_contains_usage() {
    # Capture help output (will exit, so use subshell)
    local output=$(echo_help 2>&1 || true)
    assert_contains "$output" "Usage" "Help should contain usage instructions"
}

test_echo_help_contains_setup_command() {
    local output=$(echo_help 2>&1 || true)
    assert_contains "$output" "setup" "Help should mention setup command"
}

test_echo_help_contains_start_command() {
    local output=$(echo_help 2>&1 || true)
    assert_contains "$output" "start" "Help should mention start command"
}

test_echo_help_contains_backup_command() {
    local output=$(echo_help 2>&1 || true)
    assert_contains "$output" "backup" "Help should mention backup command"
}

# Run all tests
test_print_banner_function_exists
test_print_banner_outputs_text
test_echo_help_function_exists
test_echo_help_contains_usage
test_echo_help_contains_setup_command
test_echo_help_contains_start_command
test_echo_help_contains_backup_command

echo "All ui.sh tests passed!"
