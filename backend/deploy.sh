#!/bin/bash

# AI Browser Contextual Search Deployment Script
# Usage: ./deploy.sh [platform] [environment]

set -e

PLATFORM=${1:-render}
ENVIRONMENT=${2:-production}

echo "🚀 Deploying AI Browser Contextual Search to $PLATFORM ($ENVIRONMENT)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_status "Docker is installed"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_status "Docker Compose is available"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        print_status "Node.js is installed"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Deploy to Render
deploy_render() {
    print_status "Deploying to Render..."
    
    # Check if render.yaml exists
    if [ ! -f "render.yaml" ]; then
        print_error "render.yaml not found. Creating one..."
        create_render_config
    fi
    
    # Check if Render CLI is installed
    if command -v render &> /dev/null; then
        print_status "Render CLI detected, deploying..."
        render deploy
    else
        print_warning "Render CLI not installed. Manual deployment required:"
        echo "1. Go to https://dashboard.render.com"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect your GitHub repository"
        echo "4. Use the following settings:"
        echo "   - Name: ai-browser-backend"
        echo "   - Environment: Docker"
        echo "   - Branch: main"
        echo "   - Root Directory: backend"
        echo "   - Build Command: docker build -t ai-browser-backend ."
        echo "   - Start Command: docker run -p 3000:3000 ai-browser-backend"
        echo "5. Add environment variables from .env.production"
    fi
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if command -v railway &> /dev/null; then
        print_status "Railway CLI detected, deploying..."
        railway up
    else
        print_warning "Railway CLI not installed. Manual deployment required:"
        echo "1. Go to https://railway.app"
        echo "2. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "3. Select your repository"
        echo "4. Add environment variables from .env.production"
        echo "5. Deploy!"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if command -v vercel &> /dev/null; then
        print_status "Vercel CLI detected, deploying..."
        vercel --prod
    else
        print_warning "Vercel CLI not installed. Manual deployment required:"
        echo "1. Go to https://vercel.com"
        echo "2. Import your GitHub repository"
        echo "3. Configure as Node.js project"
        echo "4. Build Command: cd backend && npm install && npm run build"
        echo "5. Output Directory: backend"
        echo "6. Add environment variables"
    fi
}

# Deploy locally with Docker
deploy_local() {
    print_status "Deploying locally with Docker..."
    
    cd backend
    
    # Build Docker image
    print_status "Building Docker image..."
    docker build -t ai-browser-backend:latest .
    
    # Stop existing container if running
    if docker ps -a --format '{{.Names}}' | grep -q 'ai-browser-backend'; then
        print_status "Stopping existing container..."
        docker stop ai-browser-backend || true
        docker rm ai-browser-backend || true
    fi
    
    # Run new container
    print_status "Starting new container..."
    docker run -d \
        --name ai-browser-backend \
        -p 3000:3000 \
        --env-file .env.production \
        -v $(pwd)/data:/app/data \
        ai-browser-backend:latest
    
    print_status "Local deployment complete!"
    echo "Backend available at: http://localhost:3000"
    echo "Health check: http://localhost:3000/health"
}

# Create Render configuration
create_render_config() {
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: ai-browser-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: CACHE_CLEAR_PASSWORD
        generateValue: true
    healthCheckPath: /health
    autoDeploy: true
    regions:
      - oregon
    plan: free
    numInstances: 1
EOF
    print_status "Created render.yaml configuration"
}

# Create production environment file
create_production_env() {
    if [ ! -f "backend/.env.production" ]; then
        cat > backend/.env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=3000
CACHE_CLEAR_PASSWORD=$(openssl rand -hex 32)
LOG_LEVEL=info
MAX_REQUEST_SIZE=10mb
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# AI Model Settings
ENABLE_OBJECT_DETECTION=true
ENABLE_OCR=true
ENABLE_FACE_RECOGNITION=false

# Cache Settings
CACHE_TTL=300000
CACHE_MAX_SIZE=100

# Security
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000
EOF
        print_status "Created .env.production file"
    fi
}

# Main deployment function
main() {
    check_prerequisites
    create_production_env
    
    case $PLATFORM in
        "render")
            deploy_render
            ;;
        "railway")
            deploy_railway
            ;;
        "vercel")
            deploy_vercel
            ;;
        "local")
            deploy_local
            ;;
        "all")
            print_status "Deploying to all platforms..."
            deploy_local
            deploy_render
            deploy_railway
            deploy_vercel
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            echo "Available platforms: render, railway, vercel, local, all"
            exit 1
            ;;
    esac
    
    print_status "Deployment completed successfully!"
    
    # Show deployment info
    echo ""
    echo "📋 Deployment Summary:"
    echo "====================="
    echo "Platform: $PLATFORM"
    echo "Environment: $ENVIRONMENT"
    echo "Backend URL: Depends on platform"
    echo "Health Check: /health"
    echo "API Documentation: /api-docs (coming soon)"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Update extension to point to your backend URL"
    echo "2. Test the API endpoints"
    echo "3. Monitor logs for any issues"
    echo "4. Scale up as needed"
}

# Run main function
main "$@"