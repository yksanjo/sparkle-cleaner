#!/bin/bash

# ✨ Sparkle Cleaner AUTO — Silent cleanup, no prompts
# For support use: send this to users who need a hassle-free cleanup
# Usage: ./sparkle-auto.sh <your-token>

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

API_URL="${SPARKLE_API_URL:-https://sparkle-cleaner.vercel.app}"
PAYMENT_LINK="${SPARKLE_PAYMENT_LINK:-https://buy.stripe.com/9B6fZg4arfyb3s10Su43S00}"

step()    { echo -e "${BLUE}➜  $1${NC}"; }
success() { echo -e "${GREEN}✓  $1${NC}"; }
err()     { echo -e "${RED}✗  $1${NC}"; }
hr()      { echo "────────────────────────────────────────────"; }

print_logo() {
    echo ""
    echo -e "${PURPLE}"
    echo " ____                   _    _      "
    echo "/ ___| _ __   __ _ _ __| | _| | ___ "
    echo "\___ \| '_ \ / _\` | '__| |/ / |/ _ \\"
    echo " ___) | |_) | (_| | |  |   <| |  __/"
    echo "|____/| .__/ \__,_|_|  |_|\_\_|\___|"
    echo "      |_|     ✨ Auto Clean by Yoshi Kondo"
    echo -e "${NC}"
    echo ""
}

if [ -z "$1" ]; then
    print_logo
    err "Token required."
    echo ""
    echo "   Usage: ./sparkle-auto.sh <your-token>"
    echo "   Get a token: ${PAYMENT_LINK}"
    echo ""
    exit 1
fi

TOKEN="$1"
print_logo

# ── Validate token ────────────────────────────────────────────────────────────
step "Validating token..."

if ! ping -c 1 8.8.8.8 &> /dev/null; then
    err "No internet connection."
    exit 1
fi

VALIDATION=$(curl -s -X POST "$API_URL/api/stripe/validate-token" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TOKEN\"}")

if ! echo "$VALIDATION" | grep -q '"valid":true'; then
    err "Token invalid or expired."
    echo ""
    echo "   • Tokens expire after 24 hours"
    echo "   • Each token is single-use"
    echo "   • Get a new one: ${PAYMENT_LINK}"
    echo ""
    exit 1
fi

success "Token valid."
echo ""

# ── Scan ──────────────────────────────────────────────────────────────────────
hr
step "Scanning your Mac..."
hr
echo ""

SCAN_JSON="["
FIRST=1
TOTAL_BYTES=0
CLEANED_COUNT=0
SPACE_FREED=0

add_finding() {
    local label="$1"
    local path="$2"
    if [ -d "$path" ]; then
        local size bytes
        size=$(du -sh "$path" 2>/dev/null | cut -f1)
        bytes=$(du -sk "$path" 2>/dev/null | cut -f1)
        [ $FIRST -eq 0 ] && SCAN_JSON+=","
        SCAN_JSON+="{\"label\":\"$label\",\"size\":\"$size\"}"
        FIRST=0
        TOTAL_BYTES=$((TOTAL_BYTES + bytes))
        printf "   %-30s %s\n" "$label" "$size"
    fi
}

add_finding "Safari cache"        "$HOME/Library/Caches/com.apple.Safari"
add_finding "Chrome cache"        "$HOME/Library/Application Support/Google/Chrome/Default/Cache"
add_finding "Firefox cache"       "$HOME/Library/Caches/Firefox"
add_finding "App caches"          "$HOME/Library/Caches"
add_finding "System caches"       "/Library/Caches"
add_finding "Log files"           "$HOME/Library/Logs"
add_finding "Temporary files"     "/private/tmp"
add_finding "Xcode derived data"  "$HOME/Library/Developer/Xcode/DerivedData"

SCAN_JSON+="]"

TOTAL_GB=$(echo "scale=1; $TOTAL_BYTES / 1048576" | bc 2>/dev/null || echo "?")
echo ""
echo -e "   ${YELLOW}Found ~${TOTAL_GB} GB to clean${NC}"
echo ""

# ── Claude analysis ───────────────────────────────────────────────────────────
step "Getting AI analysis..."
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

# ── Auto cleanup ──────────────────────────────────────────────────────────────
hr
step "Cleaning automatically — no prompts needed."
hr
echo ""

auto_delete() {
    local label="$1"
    local path="$2"
    if [ ! -d "$path" ]; then return; fi

    local before after freed
    before=$(du -sk "$path" 2>/dev/null | cut -f1)
    rm -rf "$path" 2>/dev/null || true
    freed=$before
    SPACE_FREED=$((SPACE_FREED + freed))
    CLEANED_COUNT=$((CLEANED_COUNT + 1))
    success "Cleaned $label"
}

auto_delete "Safari cache"        "$HOME/Library/Caches/com.apple.Safari"
auto_delete "Chrome cache"        "$HOME/Library/Application Support/Google/Chrome/Default/Cache"
auto_delete "Firefox cache"       "$HOME/Library/Caches/Firefox"
auto_delete "App caches"          "$HOME/Library/Caches"
auto_delete "System caches"       "/Library/Caches"
auto_delete "Log files"           "$HOME/Library/Logs"
auto_delete "Temporary files"     "/private/tmp"
auto_delete "Xcode derived data"  "$HOME/Library/Developer/Xcode/DerivedData"

# ── Mark token used ───────────────────────────────────────────────────────────
curl -s -X POST "$API_URL/api/stripe/consume-token" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$TOKEN\"}" > /dev/null

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
hr
FREED_GB=$(echo "scale=1; $SPACE_FREED / 1048576" | bc 2>/dev/null || echo "?")
echo ""
echo -e "   ${GREEN}✨ All done!${NC}"
echo ""
echo -e "   Items cleaned:   ${CLEANED_COUNT}"
echo -e "   Space freed:     ~${FREED_GB} GB"
echo ""
echo "   Your Mac is sparkling clean."
echo ""
hr
echo ""
