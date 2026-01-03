#!/bin/bash

# Test Helper Functions

# Assert equals
assert_equals() {
    local expected=$1
    local actual=$2
    local message=${3:-"Values should be equal"}
    
    if [[ "$expected" == "$actual" ]]; then
        return 0
    else
        echo "ASSERTION FAILED: $message"
        echo "  Expected: $expected"
        echo "  Actual:   $actual"
        return 1
    fi
}

# Assert not equals
assert_not_equals() {
    local not_expected=$1
    local actual=$2
    local message=${3:-"Values should not be equal"}
    
    if [[ "$not_expected" != "$actual" ]]; then
        return 0
    else
        echo "ASSERTION FAILED: $message"
        echo "  Should not be: $not_expected"
        echo "  But was:       $actual"
        return 1
    fi
}

# Assert contains
assert_contains() {
    local haystack=$1
    local needle=$2
    local message=${3:-"String should contain substring"}
    
    if [[ "$haystack" == *"$needle"* ]]; then
        return 0
    else
        echo "ASSERTION FAILED: $message"
        echo "  String: $haystack"
        echo "  Should contain: $needle"
        return 1
    fi
}

# Assert file exists
assert_file_exists() {
    local file=$1
    local message=${2:-"File should exist"}
    
    if [[ -f "$file" ]]; then
        return 0
    else
        echo "ASSERTION FAILED: $message"
        echo "  File not found: $file"
        return 1
    fi
}

# Assert function exists
assert_function_exists() {
    local function_name=$1
    local message=${2:-"Function should exist"}
    
    if declare -f "$function_name" > /dev/null; then
        return 0
    else
        echo "ASSERTION FAILED: $message"
        echo "  Function not found: $function_name"
        return 1
    fi
}

# Assert exit code
assert_exit_code() {
    local expected_code=$1
    local actual_code=$2
    local message=${3:-"Exit code should match"}
    
    if [[ $expected_code -eq $actual_code ]]; then
        return 0
    else
        echo "ASSERTION FAILED: $message"
        echo "  Expected exit code: $expected_code"
        echo "  Actual exit code:   $actual_code"
        return 1
    fi
}

# Mock function
mock_function() {
    local function_name=$1
    local return_value=${2:-0}
    
    eval "$function_name() { return $return_value; }"
}

# Capture output
capture_output() {
    local command=$1
    eval "$command" 2>&1
}
