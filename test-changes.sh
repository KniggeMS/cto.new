#!/bin/bash

echo "=== Testing Search and Watchlist Integration ==="

# Check if we can build the API
echo "Building API..."
cd /home/engine/project/apps/api
npm run build

if [ $? -eq 0 ]; then
    echo "✅ API build successful"
else
    echo "❌ API build failed"
    exit 1
fi

# Check if we can build the web app
echo "Building web app..."
cd /home/engine/project/apps/web
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Web build successful"
else
    echo "❌ Web build failed"
    exit 1
fi

# Type checking
echo "Type checking API..."
cd /home/engine/project/apps/api
npm run typecheck

if [ $? -eq 0 ]; then
    echo "✅ API type checking successful"
else
    echo "❌ API type checking failed"
    exit 1
fi

echo "Type checking web app..."
cd /home/engine/project/apps/web
npm run typecheck

if [ $? -eq 0 ]; then
    echo "✅ Web type checking successful"
else
    echo "❌ Web type checking failed"
    exit 1
fi

echo "=== Summary ==="
echo "✅ All builds and type checks passed!"
echo "🔧 Key changes implemented:"
echo "  - Search API now returns normalized camelCase fields"
echo "  - Search response wrapped in { data, page, totalPages, totalResults }"
echo "  - Web client sends metadata when adding to watchlist"
echo "  - Optimistic updates include proper metadata"
echo "  - Integration tests created for search-to-watchlist flow"