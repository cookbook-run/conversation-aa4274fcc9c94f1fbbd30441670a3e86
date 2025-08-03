#!/bin/bash

echo "Project Management SaaS Deployment Helper"
echo "========================================"
echo ""
echo "Choose your deployment method:"
echo "1. Docker (Local/VPS)"
echo "2. Vercel + Railway"
echo "3. Render.com"
echo "4. Manual deployment"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo "Docker Deployment"
    echo "================"
    echo ""
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Generate JWT secret if not exists
    if [ ! -f .env ]; then
        echo "Generating JWT secret..."
        JWT_SECRET=$(openssl rand -base64 32)
        echo "JWT_SECRET=$JWT_SECRET" > .env
        echo ".env file created with JWT secret"
    fi
    
    # Build and start containers
    echo "Building and starting containers..."
    docker-compose up -d --build
    
    echo ""
    echo "Deployment complete! Application is running at:"
    echo "Frontend: http://localhost"
    echo "Backend: http://localhost:5000"
    ;;
    
  2)
    echo "Vercel + Railway Deployment"
    echo "==========================="
    echo ""
    echo "Prerequisites:"
    echo "- GitHub repository with your code"
    echo "- Vercel account (https://vercel.com)"
    echo "- Railway account (https://railway.app)"
    echo ""
    echo "Steps:"
    echo "1. Deploy Backend to Railway:"
    echo "   - Connect your GitHub repo to Railway"
    echo "   - Set root directory to /server"
    echo "   - Add JWT_SECRET environment variable"
    echo "   - Deploy and copy the URL"
    echo ""
    echo "2. Deploy Frontend to Vercel:"
    echo "   - Import your GitHub repo to Vercel"
    echo "   - Set root directory to /client"
    echo "   - Add VITE_API_URL environment variable (Railway URL + /api)"
    echo "   - Deploy"
    echo ""
    echo "Detailed instructions in DEPLOYMENT.md"
    ;;
    
  3)
    echo "Render.com Deployment"
    echo "===================="
    echo ""
    echo "Prerequisites:"
    echo "- GitHub repository with your code"
    echo "- Render.com account (https://render.com)"
    echo ""
    echo "Steps:"
    echo "1. Create a Web Service for backend (/server)"
    echo "2. Create a Static Site for frontend (/client)"
    echo "3. Configure environment variables"
    echo "4. Set up persistent disk for database"
    echo ""
    echo "Detailed instructions in DEPLOYMENT.md"
    ;;
    
  4)
    echo "Manual Deployment"
    echo "================"
    echo ""
    echo "Backend deployment:"
    echo "1. Copy /server to your server"
    echo "2. Run: npm install"
    echo "3. Set environment variables"
    echo "4. Run: npm start (use PM2 for production)"
    echo ""
    echo "Frontend deployment:"
    echo "1. In /client, run: npm run build"
    echo "2. Deploy /dist folder to any static host"
    echo "3. Configure VITE_API_URL before building"
    echo ""
    echo "See DEPLOYMENT.md for detailed instructions"
    ;;
    
  *)
    echo "Invalid choice. Please run the script again."
    exit 1
    ;;
esac