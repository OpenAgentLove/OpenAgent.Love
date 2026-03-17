#!/bin/bash

# Test Runner Script for Agent Marriage Breeding Skill
# Usage: ./run-tests.sh [options]
# Options:
#   --coverage    Run with code coverage
#   --watch       Run in watch mode
#   --single      Run single test file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Agent Marriage Breeding - Test Suite${NC}"
echo "============================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Parse arguments
COVERAGE=""
WATCH=""
SINGLE=""

for arg in "$@"; do
    case $arg in
        --coverage)
            COVERAGE="--coverage"
            shift
            ;;
        --watch)
            WATCH="--watch"
            shift
            ;;
        --single)
            SINGLE="$2"
            shift 2
            ;;
    esac
done

# Run tests
if [ -n "$SINGLE" ]; then
    echo -e "${YELLOW}Running single test file: $SINGLE${NC}"
    npx mocha "$SINGLE" $COVERAGE
elif [ -n "$WATCH" ]; then
    echo -e "${YELLOW}Running in watch mode...${NC}"
    npx mocha 'tests/**/*.js' --watch
else
    echo -e "${GREEN}Running all tests...${NC}"
    npx mocha 'tests/**/*.js' $COVERAGE
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
