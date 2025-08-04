#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the project
echo "📦 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🌐 Your app is ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your changes to GitHub"
    echo "2. Render will automatically redeploy"
    echo "3. Check your Render dashboard for deployment status"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi 