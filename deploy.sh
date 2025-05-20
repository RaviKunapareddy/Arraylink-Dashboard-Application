#!/bin/bash

# ArrayLink AI Azure Deployment Script
echo "🚀 Preparing ArrayLink AI Dashboard for Azure deployment..."

# Step 1: Ensure we're in the right directory
cd "$(dirname "$0")"
echo "📁 Working in directory: $(pwd)"

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

# Step 3: Build the application
echo "🔨 Building the application..."
npm run build

# Step 4: Ensure environment variables are set up
if [ ! -f ".env.local" ]; then
  echo "⚠️ No .env.local file found. Creating from sample..."
  cp .env.sample .env.local
  echo "⚙️ Please edit .env.local to add your Twilio credentials"
  echo "   Then run this script again"
  exit 1
fi

# Step 5: Initialize git if needed
if [ ! -d ".git" ]; then
  echo "🔄 Initializing git repository..."
  git init
  git add .
  git commit -m "Initial commit for Azure deployment"
else
  echo "✅ Git repository already initialized"
  echo "🔄 Committing changes..."
  git add .
  git commit -m "Prepare for Azure deployment"
fi

echo ""
echo "✅ Your ArrayLink AI Dashboard is ready for Azure deployment!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository at https://github.com/new"
echo "2. Run the following commands to push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/arraylink-dashboard.git"
echo "   git push -u origin main"
echo ""
echo "3. Follow the Azure deployment instructions in the README.md file"
echo ""
