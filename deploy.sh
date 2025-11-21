#!/bin/bash

# Quick deployment script
# Usage: ./deploy.sh "commit message"

set -e

echo "🚀 Starting deployment..."

# Add all changes
git add .

# Commit with message
if [ -z "$1" ]; then
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
else
    git commit -m "$1"
fi

# Push to GitHub
git push origin main

echo "✅ Deployed successfully!"
echo "⏳ Vercel will auto-deploy in ~1-2 minutes"
