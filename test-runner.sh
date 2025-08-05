#!/bin/bash

# P2P Platform API Test Runner
# This script helps run different types of tests for the API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} P2P Platform API Test Runner${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_server() {
    print_info "Checking if server is running..."
    if curl -f -s http://localhost:5000/health > /dev/null; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running. Please start the server first with 'npm run dev'"
        return 1
    fi
}

run_tests() {
    local test_type=$1
    
    print_info "Running $test_type tests..."
    
    case $test_type in
        "all")
            npm run test
            ;;
        "auth")
            npm run test:auth
            ;;
        "users")
            npm run test:users
            ;;
        "items")
            npm run test:items
            ;;
        "bookings")
            npm run test:bookings
            ;;
        "categories")
            npm run test:categories
            ;;
        "integration")
            npm run test:integration
            ;;
        "headless")
            npm run test:headless
            ;;
        "chrome")
            npm run test:chrome
            ;;
        "firefox")
            npm run test:firefox
            ;;
        "ci")
            npm run test:ci
            ;;
        *)
            print_error "Unknown test type: $test_type"
            show_usage
            exit 1
            ;;
    esac
}

show_usage() {
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_TYPE]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -s, --skip-server-check  Skip server health check"
    echo ""
    echo "Test Types:"
    echo "  all           Run all tests (default)"
    echo "  auth          Run authentication tests only"
    echo "  users         Run user management tests only"
    echo "  items         Run item management tests only"
    echo "  bookings      Run booking system tests only"
    echo "  categories    Run category tests only"
    echo "  integration   Run integration tests only"
    echo "  headless      Run all tests in headless mode"
    echo "  chrome        Run tests in Chrome browser"
    echo "  firefox       Run tests in Firefox browser"
    echo "  ci            Run tests in CI mode"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 auth              # Run only authentication tests"
    echo "  $0 integration       # Run only integration tests"
    echo "  $0 --skip-server-check headless  # Run headless without server check"
}

# Parse command line arguments
SKIP_SERVER_CHECK=false
TEST_TYPE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -s|--skip-server-check)
            SKIP_SERVER_CHECK=true
            shift
            ;;
        *)
            TEST_TYPE=$1
            shift
            ;;
    esac
done

# Main execution
print_header

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    npm install
fi

# Check server health unless skipped
if [ "$SKIP_SERVER_CHECK" = false ]; then
    if ! check_server; then
        exit 1
    fi
fi

# Run the specified tests
if run_tests $TEST_TYPE; then
    print_success "Tests completed successfully!"
    echo ""
    print_info "Test results can be found in:"
    print_info "  - Screenshots: cypress/screenshots/"
    print_info "  - Videos: cypress/videos/"
else
    print_error "Tests failed!"
    exit 1
fi

echo ""
print_info "For interactive testing, run: npm run test:open"
print_info "For more options, run: $0 --help"