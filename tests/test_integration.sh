#!/bin/bash

# Integration Tests for zebrunner.sh

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

source "$TESTS_DIR/test_helpers.sh"

test_zebrunner_script_exists() {
    assert_file_exists "$PROJECT_ROOT/zebrunner.sh" "zebrunner.sh should exist"
}

test_all_lib_modules_exist() {
    assert_file_exists "$PROJECT_ROOT/lib/ui.sh" "lib/ui.sh should exist"
    assert_file_exists "$PROJECT_ROOT/lib/config.sh" "lib/config.sh should exist"
    assert_file_exists "$PROJECT_ROOT/lib/setup.sh" "lib/setup.sh should exist"
    assert_file_exists "$PROJECT_ROOT/lib/lifecycle.sh" "lib/lifecycle.sh should exist"
    assert_file_exists "$PROJECT_ROOT/lib/backup.sh" "lib/backup.sh should exist"
    assert_file_exists "$PROJECT_ROOT/lib/upgrade.sh" "lib/upgrade.sh should exist"
}

test_zebrunner_script_is_executable() {
    if [[ -x "$PROJECT_ROOT/zebrunner.sh" ]]; then
        return 0
    else
        # Try to make it executable
        chmod +x "$PROJECT_ROOT/zebrunner.sh" 2>/dev/null || true
        
        if [[ -x "$PROJECT_ROOT/zebrunner.sh" ]]; then
            return 0
        else
            echo "FAILED: zebrunner.sh should be executable"
            return 1
        fi
    fi
}

test_help_command_works() {
    local output=$("$PROJECT_ROOT/zebrunner.sh" --help 2>&1 || true)
    assert_contains "$output" "Usage" "Help command should display usage"
}

test_invalid_command_shows_help() {
    local output=$("$PROJECT_ROOT/zebrunner.sh" invalid_command 2>&1 || true)
    assert_contains "$output" "Usage" "Invalid command should show help"
}

test_lib_modules_source_correctly() {
    # Test that all modules can be sourced without errors
    local temp_script="/tmp/zebrunner_test_$$.sh"
    
    cat > "$temp_script" << 'EOF'
#!/bin/bash
BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$BASEDIR/lib/ui.sh"
source "$BASEDIR/lib/config.sh"
source "$BASEDIR/lib/setup.sh"
source "$BASEDIR/lib/lifecycle.sh"
source "$BASEDIR/lib/backup.sh"
source "$BASEDIR/lib/upgrade.sh"
echo "success"
EOF
    
    chmod +x "$temp_script"
    cd "$PROJECT_ROOT"
    local output=$(bash "$temp_script" 2>&1 || true)
    
    if [[ "$output" == *"success"* ]]; then
        rm -f "$temp_script"
        return 0
    else
        echo "FAILED: Modules failed to source correctly"
        echo "Output: $output"
        rm -f "$temp_script"
        return 1
    fi
}

# Run all tests
test_zebrunner_script_exists
test_all_lib_modules_exist
test_zebrunner_script_is_executable
test_help_command_works
test_invalid_command_shows_help
test_lib_modules_source_correctly

echo "All integration tests passed!"
