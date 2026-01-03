#!/bin/bash

# Test Runner for Zebrunner Modular Architecture
# Runs all unit tests and reports results

set -e

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result arrays
declare -a FAILED_TEST_NAMES

echo "========================================"
echo "Zebrunner Unit Test Suite"
echo "========================================"
echo ""

# Run a single test file
run_test_file() {
    local test_file=$1
    local test_name=$(basename "$test_file" .sh)
    
    echo -n "Running ${test_name}... "
    
    if bash "$test_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED_TESTS++))
        FAILED_TEST_NAMES+=("$test_name")
        return 1
    fi
}

# Discover and run all tests
for test_file in "$TESTS_DIR"/test_*.sh; do
    if [[ -f "$test_file" ]]; then
        ((TOTAL_TESTS++))
        run_test_file "$test_file"
    fi
done

echo ""
echo "========================================"
echo "Test Results Summary"
echo "========================================"
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -gt 0 ]]; then
    echo ""
    echo -e "${RED}Failed Tests:${NC}"
    for failed_test in "${FAILED_TEST_NAMES[@]}"; do
        echo "  - $failed_test"
    done
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    exit 0
fi
