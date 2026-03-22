#!/bin/bash

# ✨ Sparkle Cleaner - AI-Powered Mac Cleanup by Yoshi Kondo
# Usage:
#   ./sparkle.sh          — free scan, shows what's on your Mac
#   ./sparkle.sh <token>  — runs cleanup (token from email after $1 payment)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ── Config ────────────────────────────────────────────────────────────────────
API_URL="${SPARKLE_API_URL:-https://sparkle-cleaner.vercel.app}"
PAYMENT_LINK="${SPARKLE_PAYMENT_LINK:-https://buy.stripe.com/9B6fZg4arfyb3s10Su43S00}"

# ── Helpers ───────────────────────────────────────────────────────────────────
print_logo() {
    echo ""
    echo -e "${PURPLE}"
    echo " ____                   _    _      "
    echo "/ ___| _ __   __ _ _ __| | _| | ___ "
    echo "\___ \| '_ \ / _\` | '__| |/ / |/ _ \\"
    echo " ___) | |_) | (_| | |  |   <| |  __/"
    echo "|____/| .__/ \__,_|_|  |_|\_\_|\___|"
    echo "      |_|        ✨ AI Cleaner by Yoshi Kondo"
    echo -e "${NC}"
    echo ""
}

step()    { echo -e "${BLUE}➜  $1${NC}"; }
success() { echo -e "${GREEN}✓  $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $1${NC}"; }
err()     { echo -e "${RED}✗  $1${NC}"; }
hr()      { echo "────────────────────────────────────────────"; }

# ── Free scan (no token) ──────────────────────────────────────────────────────
run_scan() {
    print_logo
    step "Scanning your Mac — this is read-only, nothing will be changed."
    echo ""

    TOTAL_BYTES=0

    scan_dir() {
        local label="$1"
        local path="$2"
        if [ -d "$path" ]; then
            local size
            size=$(du -sh "$path" 2>/dev/null | cut -f1)
            local bytes
            bytes=$(du -sk "$path" 2>/dev/null | cut -f1)
            printf "   %-30s %s\n" "$label" "$size"
            TOTAL_BYTES=$((TOTAL_BYTES + bytes))
        fi
    }

    hr
    echo "   What Sparkle found on your Mac:"
    hr
    scan_dir "Safari browser cache"        "$HOME/Library/Caches/com.apple.Safari"
    scan_dir "Chrome browser cache"        "$HOME/Library/Application Support/Google/Chrome/Default/Cache"
    scan_dir "Firefox browser cache"       "$HOME/Library/Caches/Firefox"
    scan_dir "App caches"                  "$HOME/Library/Caches"
    scan_dir "System caches"               "/Library/Caches"
    scan_dir "Log files"                   "$HOME/Library/Logs"
    scan_dir "Temporary files"             "/private/tmp"
    scan_dir "Xcode derived data"          "$HOME/Library/Developer/Xcode/DerivedData"
    hr
    echo ""

    TOTAL_GB=$(echo "scale=1; $TOTAL_BYTES / 1048576" | bc 2>/dev/null || echo "?")
    echo -e "   ${GREEN}Total found: ~${TOTAL_GB} GB${NC}"
    echo ""
    echo "   None of this has been deleted. Sparkle only looked."
    echo ""
    hr
    echo ""
    echo "   To clean this up, pay $1 here — token sent to your email:"
    echo ""
    echo -e "   ${PURPLE}${PAYMENT_LINK}${NC}"
    echo ""
    echo "   Then run:  ./sparkle.sh <your-token>"
    echo ""
    hr
    echo ""
    echo "   Questions? Open an issue: https://github.com/yksanjo/sparkle-cleaner"
    echo ""
}

# ── Paid cleanup (with token) ─────────────────────────────────────────────────
run_cleanup() {
    local TOKEN="$1"

    print_logo
    step "Validating your token..."

    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        err "No internet connection."
        exit 1
    fi

    VALIDATION=$(curl -s -X POST "$API_URL/api/stripe/validate-token" \
        -H "Content-Type: application/json" \
        -d "{\"token\": \"$TOKEN\"}")

    if ! echo "$VALIDATION" | grep -q '"valid":true'; then
        err "Token is invalid or expired."
        echo ""
        echo "   • Tokens expire 24 hours after purchase"
        echo "   • Each token is single-use"
        echo "   • Get a new one: ${PAYMENT_LINK}"
        echo ""
        exit 1
    fi

    success "Token valid."
    echo ""

    # ── Scan ──────────────────────────────────────────────────────────────────
    hr
    step "Scanning your Mac..."
    hr
    echo ""

    SCAN_JSON="["
    FIRST=1

    add_finding() {
        local label="$1"
        local path="$2"
        if [ -d "$path" ]; then
            local size
            size=$(du -sh "$path" 2>/dev/null | cut -f1)
            [ $FIRST -eq 0 ] && SCAN_JSON+=","
            SCAN_JSON+="{\"label\":\"$label\",\"size\":\"$size\"}"
            FIRST=0
            printf "   %-30s %s\n" "$label" "$size"
        fi
    }

    add_finding "Safari cache"          "$HOME/Library/Caches/com.apple.Safari"
    add_finding "Chrome cache"          "$HOME/Library/Application Support/Google/Chrome/Default/Cache"
    add_finding "Firefox cache"         "$HOME/Library/Caches/Firefox"
    add_finding "App caches"            "$HOME/Library/Caches"
    add_finding "System caches"         "/Library/Caches"
    add_finding "Log files"             "$HOME/Library/Logs"
    add_finding "Temporary files"       "/private/tmp"
    add_finding "Xcode derived data"    "$HOME/Library/Developer/Xcode/DerivedData"

    SCAN_JSON+="]"

    echo ""

    # ── Claude analysis ───────────────────────────────────────────────────────
    step "Asking Claude to analyse your results..."
    echo ""

    ANALYSIS_RESPONSE=$(curl -s -X POST "$API_URL/api/analyze" \
        -H "Content-Type: application/json" \
        -d "{\"findings\": $SCAN_JSON, \"token\": \"$TOKEN\"}")

    ANALYSIS=$(echo "$ANALYSIS_RESPONSE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('analysis') or '')
except: pass
" 2>/dev/null)

    if [ -n "$ANALYSIS" ]; then
        echo -e "${PURPLE}   $ANALYSIS${NC}"
        echo ""
    fi

    hr
    step "Starting cleanup — you will approve each action."
    hr
    echo ""

    approve_and_delete() {
        local label="$1"
        local path="$2"
        if [ ! -d "$path" ]; then return; fi

        local size
        size=$(du -sh "$path" 2>/dev/null | cut -f1)
        echo ""
        echo -e "   ${YELLOW}Delete ${label} (${size})?${NC}"
        echo "   Path: $path"
        printf "   Approve? [y/N] "
        read -r answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            rm -rf "$path"
            success "Deleted ${label} (${size} freed)"
        else
            echo "   Skipped."
        fi
    }

    approve_and_delete "Safari browser cache"   "$HOME/Library/Caches/com.apple.Safari"
    approve_and_delete "Chrome browser cache"   "$HOME/Library/Application Support/Google/Chrome/Default/Cache"
    approve_and_delete "Firefox browser cache"  "$HOME/Library/Caches/Firefox"
    approve_and_delete "App caches"             "$HOME/Library/Caches"
    approve_and_delete "System caches"          "/Library/Caches"
    approve_and_delete "Log files"              "$HOME/Library/Logs"
    approve_and_delete "Temporary files"        "/private/tmp"
    approve_and_delete "Xcode derived data"     "$HOME/Library/Developer/Xcode/DerivedData"

    echo ""
    hr

    # Mark token as used
    curl -s -X POST "$API_URL/api/stripe/consume-token" \
        -H "Content-Type: application/json" \
        -d "{\"token\": \"$TOKEN\"}" > /dev/null

    success "Done. Run the scan again any time to check."
    echo ""
}

# ── Entry point ───────────────────────────────────────────────────────────────
if [ -z "$1" ]; then
    run_scan
else
    run_cleanup "$1"
fi
