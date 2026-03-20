#!/bin/bash

# 🦫 Mole Cleaner - AI-Powered Mac Cleanup
# Usage: ./mole.sh <your-cleanup-token>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API Configuration
API_URL="${MOLE_API_URL:-http://localhost:3000}"

# Logo
print_logo() {
    echo ""
    echo -e "${PURPLE}"
    echo "  __  __                      "
    echo " |  \\/  | ___  ___ ___  __ _  "
    echo " | |\\/| |/ _ \\/ __/ __|/ _\` | "
    echo " | |  | |  __/\\__ \\__ \\ (_| | "
    echo " |_|  |_|\\___||___/___/\\__,_| "
    echo "          🦫 AI Cleaner       "
    echo -e "${NC}"
    echo ""
}

# Print step
print_step() {
    echo -e "${BLUE}➜ $1${NC}"
}

# Print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if token is provided
if [ -z "$1" ]; then
    print_logo
    print_error "Missing cleanup token!"
    echo ""
    echo "Usage: ./mole.sh <your-cleanup-token>"
    echo ""
    echo "Get your token after payment at: https://mole-cleaner.com"
    exit 1
fi

TOKEN=$1

print_logo
print_step "🦫 Mole is waking up..."
echo ""

# Check internet connection
print_step "Checking internet connection..."
if ! ping -c 1 8.8.8.8 &> /dev/null; then
    print_error "No internet connection. Mole needs internet to verify your token."
    exit 1
fi
print_success "Connected!"

# Validate token
print_step "Validating your cleanup token..."
VALIDATION_RESPONSE=$(curl -s -X POST "$API_URL/api/stripe/validate-token" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TOKEN\"}")

VALID=$(echo "$VALIDATION_RESPONSE" | grep -o '"valid":true' || echo "")

if [ -z "$VALID" ]; then
    print_error "Invalid or expired token!"
    echo "Response: $VALIDATION_RESPONSE"
    echo ""
    echo "Please check your token or contact support."
    exit 1
fi

print_success "Token validated! Let's clean up this Mac! 🎉"
echo ""

# System info
print_step "Gathering system information..."
echo ""

# Disk usage
print_step "📀 Disk Usage:"
df -h / | tail -n 1 | awk '{print "   Total: "$2" | Used: "$3" | Available: "$4" | Use: "$5}'
echo ""

# Check common spam locations
print_step "🔍 Scanning for common spam locations..."
echo ""

# Cache sizes
CACHE_SIZE=0
if [ -d "$HOME/Library/Caches" ]; then
    CACHE_SIZE=$(du -sh "$HOME/Library/Caches" 2>/dev/null | cut -f1)
    echo "   User Caches: $CACHE_SIZE"
fi

if [ -d "/Library/Caches" ]; then
    SYSTEM_CACHE=$(du -sh "/Library/Caches" 2>/dev/null | cut -f1)
    echo "   System Caches: $SYSTEM_CACHE"
fi

# Logs
LOG_SIZE=0
if [ -d "$HOME/Library/Logs" ]; then
    LOG_SIZE=$(du -sh "$HOME/Library/Logs" 2>/dev/null | cut -f1)
    echo "   User Logs: $LOG_SIZE"
fi

# Downloads folder
if [ -d "$HOME/Downloads" ]; then
    DOWNLOADS_SIZE=$(du -sh "$HOME/Downloads" 2>/dev/null | cut -f1)
    DOWNLOADS_COUNT=$(ls -1 "$HOME/Downloads" 2>/dev/null | wc -l)
    echo "   Downloads: $DOWNLOADS_SIZE ($DOWNLOADS_COUNT files)"
fi

echo ""

# Start cleanup session
print_step "🚀 Starting AI-powered cleanup session..."
echo ""

CLEANUP_RESPONSE=$(curl -s -X POST "$API_URL/api/cleanup/start" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TOKEN\"}")

echo "$CLEANUP_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'message' in data:
        print('   ' + data['message'])
    if 'claudeResponse' in data:
        print()
        print('   🦫 Mole says:')
        for line in data['claudeResponse'].split('\\n'):
            if line.strip():
                print('   ' + line)
except:
    pass
"

echo ""
print_success "Cleanup session started!"
echo ""

# Mark token as used
curl -s -X POST "$API_URL/api/stripe/consume-token" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TOKEN\"}" > /dev/null

print_step "📝 What happens next:"
echo ""
echo "   1. Mole is analyzing your system..."
echo "   2. Safe-to-delete files will be identified"
echo "   3. You'll get a report before anything is deleted"
echo "   4. Only YOU decide what gets removed"
echo ""

print_success "🦫 Mole is working! Check your dashboard for progress."
echo ""
echo "   Session ID: $(echo "$CLEANUP_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)"
echo ""
echo "   Visit: https://mole-cleaner.com/status to see live progress"
echo ""
print_warning "Note: This script only scans. Review and approve deletions in the dashboard."
echo ""
