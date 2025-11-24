#!/bin/bash

# Railway Deployment Verification Script
# This script runs comprehensive smoke tests against a Railway-deployed InFocus API
# Usage: ./scripts/verify-railway-deployment.sh <railway-domain> <access-token>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RAILWAY_DOMAIN="${1:-}"
ACCESS_TOKEN="${2:-}"

# Display usage if missing arguments
if [ -z "$RAILWAY_DOMAIN" ]; then
  echo -e "${RED}Usage: $0 <railway-domain> [access-token]${NC}"
  echo ""
  echo "Example:"
  echo "  $0 infocus-api-abc123.railway.app eyJhbGc..."
  echo ""
  echo "To get your Railway domain:"
  echo "  railway domains list"
  echo ""
  echo "To get an access token, run registration/login test first"
  exit 1
fi

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run a test
run_test() {
  local test_name=$1
  local command=$2
  
  echo -e "${BLUE}→ Testing: $test_name${NC}"
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ $test_name passed${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ $test_name failed${NC}"
    echo -e "${YELLOW}  Command: $command${NC}"
    ((TESTS_FAILED++))
  fi
  echo ""
}

# Helper function for HTTP requests
http_test() {
  local method=$1
  local endpoint=$2
  local data=$3
  local headers=$4
  
  if [ -z "$headers" ]; then
    headers="-H 'Content-Type: application/json'"
  fi
  
  curl -s -X "$method" "https://${RAILWAY_DOMAIN}${endpoint}" \
    $headers \
    ${data:+-d "$data"}
}

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}Railway Deployment Verification${NC}"
echo -e "${BLUE}Domain: $RAILWAY_DOMAIN${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Test 1: Health Check
echo -e "${BLUE}=== Test Suite 1: Health Check ===${NC}"
HEALTH_RESPONSE=$(http_test GET "/health" "")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null || echo "")

if [ "$HEALTH_STATUS" = "ok" ]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
  echo "  Response: $HEALTH_RESPONSE"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ Health check failed${NC}"
  echo "  Response: $HEALTH_RESPONSE"
  ((TESTS_FAILED++))
fi
echo ""

# Test 2: User Registration (only if no access token provided)
echo -e "${BLUE}=== Test Suite 2: User Registration ===${NC}"

if [ -z "$ACCESS_TOKEN" ]; then
  TEST_EMAIL="test-$(date +%s)@example.com"
  TEST_PASSWORD="TestPassword123!"
  
  echo "Registering test user: $TEST_EMAIL"
  REGISTER_RESPONSE=$(http_test POST "/auth/register" \
    "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\", \"name\": \"Test User\"}")
  
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken' 2>/dev/null || echo "")
  
  if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo -e "${GREEN}✓ User registration passed${NC}"
    echo "  Token: ${ACCESS_TOKEN:0:20}..."
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ User registration failed${NC}"
    echo "  Response: $REGISTER_RESPONSE"
    ((TESTS_FAILED++))
    # Continue anyway to test other endpoints
  fi
else
  echo -e "${YELLOW}✓ Using provided access token${NC}"
fi
echo ""

# Tests 3-5: Only run if we have a valid access token
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  # Test 3: Protected Route Access
  echo -e "${BLUE}=== Test Suite 3: Protected Route Access ===${NC}"
  PROFILE_RESPONSE=$(http_test GET "/api/profile" "" "-H 'Authorization: Bearer $ACCESS_TOKEN'")
  
  if echo "$PROFILE_RESPONSE" | jq -e '.user' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Protected route access granted${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ Protected route access denied${NC}"
    echo "  Response: $PROFILE_RESPONSE"
    ((TESTS_FAILED++))
  fi
  echo ""
  
  # Test 4: Watchlist CRUD Operations
  echo -e "${BLUE}=== Test Suite 4: Watchlist CRUD Operations ===${NC}"
  
  # CREATE
  echo "  Creating watchlist entry..."
  CREATE_RESPONSE=$(http_test POST "/watchlist" \
    '{
      "tmdbId": 550,
      "tmdbType": "movie",
      "status": "watching",
      "rating": 5,
      "notes": "Test entry",
      "metadata": {
        "title": "Fight Club",
        "description": "A classic film",
        "releaseDate": "1999-10-15",
        "rating": 8.5,
        "genres": ["Drama", "Thriller"]
      }
    }' \
    "-H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json'")
  
  ENTRY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id' 2>/dev/null || echo "")
  
  if [ ! -z "$ENTRY_ID" ] && [ "$ENTRY_ID" != "null" ]; then
    echo -e "${GREEN}✓ Watchlist entry created (ID: $ENTRY_ID)${NC}"
    ((TESTS_PASSED++))
    
    # READ
    echo "  Reading watchlist..."
    READ_RESPONSE=$(http_test GET "/watchlist" "" "-H 'Authorization: Bearer $ACCESS_TOKEN'")
    
    if echo "$READ_RESPONSE" | jq -e '.data | length > 0' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Watchlist read successful${NC}"
      ((TESTS_PASSED++))
    else
      echo -e "${RED}✗ Watchlist read failed${NC}"
      ((TESTS_FAILED++))
    fi
    
    # UPDATE
    echo "  Updating watchlist entry..."
    UPDATE_RESPONSE=$(http_test PUT "/watchlist/$ENTRY_ID" \
      '{"status": "completed", "rating": 4}' \
      "-H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json'")
    
    if echo "$UPDATE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Watchlist entry updated${NC}"
      ((TESTS_PASSED++))
    else
      echo -e "${RED}✗ Watchlist entry update failed${NC}"
      ((TESTS_FAILED++))
    fi
    
    # DELETE
    echo "  Deleting watchlist entry..."
    DELETE_RESPONSE=$(http_test DELETE "/watchlist/$ENTRY_ID" "" "-H 'Authorization: Bearer $ACCESS_TOKEN'")
    
    if [ "$(echo "$DELETE_RESPONSE" | jq -r '.message' 2>/dev/null)" = "Watchlist entry deleted successfully" ]; then
      echo -e "${GREEN}✓ Watchlist entry deleted${NC}"
      ((TESTS_PASSED++))
    else
      echo -e "${RED}✗ Watchlist entry delete failed${NC}"
      ((TESTS_FAILED++))
    fi
  else
    echo -e "${RED}✗ Failed to create watchlist entry${NC}"
    echo "  Response: $CREATE_RESPONSE"
    ((TESTS_FAILED+=4))
  fi
  echo ""
else
  echo -e "${YELLOW}⊘ Skipping authenticated tests (no access token)${NC}"
  echo ""
fi

# Test 5: CORS Configuration
echo -e "${BLUE}=== Test Suite 5: CORS Configuration ===${NC}"

# Try to get CORS header from OPTIONS request
CORS_RESPONSE=$(curl -s -i -X OPTIONS "https://${RAILWAY_DOMAIN}/auth/login" \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>&1)

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
  echo -e "${GREEN}✓ CORS headers present${NC}"
  ALLOW_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | head -1 | cut -d' ' -f2-)
  echo "  Access-Control-Allow-Origin: $ALLOW_ORIGIN"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⊘ CORS headers not found (may be configured differently)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Check the output above for details.${NC}"
  exit 1
fi
