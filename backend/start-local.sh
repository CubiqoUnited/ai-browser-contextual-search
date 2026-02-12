#!/bin/bash

# AI Browser Local Development Startup Script

echo "🚀 Starting AI Browser Local Development Environment"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

print_status "Node.js $(node -v) detected"

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
npm install --silent
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi
print_status "Backend dependencies installed"

# Start local test server
print_info "Starting local test server..."
node local-test.js &
BACKEND_PID=$!
sleep 2

# Check if server started
if curl -s http://localhost:3001/health > /dev/null; then
    print_status "Local test server running on http://localhost:3001"
else
    print_error "Failed to start local test server"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Test API endpoints
print_info "Testing API endpoints..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_RESPONSE" = "healthy" ]; then
    print_status "Health check: $HEALTH_RESPONSE"
else
    print_warning "Health check returned: $HEALTH_RESPONSE"
fi

# Test analysis endpoint
TEST_RESPONSE=$(curl -s -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"text-analysis","data":"Test query","privacyLevel":"medium"}' | grep -o '"type":"[^"]*"' | cut -d'"' -f4)

if [ "$TEST_RESPONSE" = "text-analysis" ]; then
    print_status "Analysis endpoint: Working"
else
    print_warning "Analysis endpoint test failed"
fi

echo ""
echo "📋 Local Development Environment Ready"
echo "====================================="
echo ""
echo "🌐 Backend API:"
echo "   - URL: http://localhost:3001"
echo "   - Health: http://localhost:3001/health"
echo "   - Test: curl -X POST http://localhost:3001/api/analyze \\"
echo "           -H \"Content-Type: application/json\" \\"
echo "           -d '{\"type\":\"text-analysis\",\"data\":\"Test\",\"privacyLevel\":\"medium\"}'"
echo ""
echo "🔧 Browser Extension Setup:"
echo "   1. Open Chrome → chrome://extensions/"
echo "   2. Enable 'Developer mode' (toggle top right)"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the 'extension' folder"
echo ""
echo "🎯 Features Available:"
echo "   - Video analysis (click 🔍 button on videos)"
echo "   - Contextual search (right-click text)"
echo "   - Privacy controls (three levels)"
echo "   - Content aggregation"
echo ""
echo "⚡ Quick Test:"
echo "   1. Visit YouTube or any video site"
echo "   2. Look for 🔍 AI Analyze button on videos"
echo "   3. Click to test video analysis"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo ""

# Keep script running
wait $BACKEND_PID

# Cleanup on exit
cleanup() {
    print_info "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    print_status "Local test server stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM