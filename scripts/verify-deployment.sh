#!/bin/bash

# InFocus Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh [railway-domain] [vercel-domain]

set -e

# Default domains (replace with actual domains)
RAILWAY_DOMAIN=${1:-"your-domain.railway.app"}
VERCEL_DOMAIN=${2:-"your-domain.vercel.app"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

echo "🚀 InFocus Deployment Verification"
echo "=================================="
echo "Railway Domain: $RAILWAY_DOMAIN"
echo "Vercel Domain: $VERCEL_DOMAIN"
echo ""

# Test 1: Railway Health Endpoint
print_info "Testing Railway health endpoint..."
if curl -f -s "https://$RAILWAY_DOMAIN/health" > /dev/null; then
    print_status 0 "Railway health endpoint responding"
    HEALTH_RESPONSE=$(curl -s "https://$RAILWAY_DOMAIN/health")
    print_info "Response: $HEALTH_RESPONSE"
else
    print_status 1 "Railway health endpoint not responding"
fi

# Test 2: Railway API Endpoints
print_info "Testing Railway API endpoints..."
if curl -f -s "https://$RAILWAY_DOMAIN/api/media/search?query=test" > /dev/null; then
    print_status 0 "Railway search API working"
else
    print_status 1 "Railway search API not working"
fi

# Test 3: Vercel Frontend
print_info "Testing Vercel frontend..."
if curl -f -s "https://$VERCEL_DOMAIN" > /dev/null; then
    print_status 0 "Vercel frontend responding"
else
    print_status 1 "Vercel frontend not responding"
fi

# Test 4: API Integration through Vercel
print_info "Testing API integration through Vercel..."
if curl -f -s "https://$VERCEL_DOMAIN/api/health" > /dev/null; then
    print_status 0 "API integration working"
else
    print_status 1 "API integration not working"
fi

# Test 5: CORS Configuration
print_info "Testing CORS configuration..."
CORS_TEST=$(curl -s -H "Origin: https://$VERCEL_DOMAIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: X-Requested-With" \
    -X OPTIONS "https://$RAILWAY_DOMAIN/api/media/search?query=test")

if [[ $CORS_TEST == *"Access-Control-Allow-Origin"* ]]; then
    print_status 0 "CORS properly configured"
else
    print_status 1 "CORS may not be properly configured"
fi

# Test 6: Database Connectivity (indirect)
print_info "Testing database connectivity (via API)..."
if curl -f -s "https://$RAILWAY_DOMAIN/api/users" > /dev/null; then
    print_status 0 "Database connectivity working"
else
    print_status 1 "Database connectivity may have issues"
fi

echo ""
echo "📊 Summary"
echo "=========="

# Performance check
print_info "Running performance checks..."

# Railway response time
RAILWAY_TIME=$(curl -o /dev/null -s -w '%{time_total}' "https://$RAILWAY_DOMAIN/health")
if (( $(echo "$RAILWAY_TIME < 1.0" | bc -l) )); then
    print_status 0 "Railway response time: ${RAILWAY_TIME}s (< 1s)"
else
    print_status 1 "Railway response time: ${RAILWAY_TIME}s (>= 1s)"
fi

# Vercel response time
VERCEL_TIME=$(curl -o /dev/null -s -w '%{time_total}' "https://$VERCEL_DOMAIN")
if (( $(echo "$VERCEL_TIME < 3.0" | bc -l) )); then
    print_status 0 "Vercel response time: ${VERCEL_TIME}s (< 3s)"
else
    print_status 1 "Vercel response time: ${VERCEL_TIME}s (>= 3s)"
fi

echo ""
echo "🎉 Deployment verification complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Fix any failed tests above"
echo "2. Run user acceptance testing"
echo "3. Set up monitoring and alerts"
echo "4. Update documentation with production URLs"
echo ""
echo "🔗 Useful Links:"
echo "- Railway Dashboard: https://railway.app/project/your-project"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- API Documentation: https://$RAILWAY_DOMAIN/docs"