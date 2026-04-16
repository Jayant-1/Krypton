#!/bin/bash
# cors-fix.sh - Helper script to configure CORS for backend
# Usage: ./cors-fix.sh <vercel-url>

set -e

if [ -z "$1" ]; then
  cat << 'EOF'
🔧 Backend CORS Configuration Helper

Usage: ./cors-fix.sh <vercel-url>

Examples:
  ./cors-fix.sh https://krypton.vercel.app
  ./cors-fix.sh https://research-assistant.vercel.app

This script will:
1. Update .env.production with your Vercel URL
2. Show you how to apply changes to back4app
3. Test the configuration

EOF
  exit 1
fi

VERCEL_URL=$1

# Validate URL format
if [[ ! $VERCEL_URL =~ ^https://.*\.vercel\.app$ ]] && [[ ! $VERCEL_URL =~ ^https://.* ]]; then
  echo "❌ Invalid URL format"
  echo "Expected: https://your-domain.vercel.app or https://custom-domain.com"
  exit 1
fi

echo "✅ Configuring CORS for: $VERCEL_URL"
echo ""

# Update .env.production
sed -i.bak "s|ALLOWED_ORIGINS=https://yourapp\.vercel\.app|ALLOWED_ORIGINS=$VERCEL_URL|g" .env.production

if grep -q "ALLOWED_ORIGINS=$VERCEL_URL" .env.production; then
  echo "✅ Updated .env.production with CORS origin"
  grep "ALLOWED_ORIGINS" .env.production
else
  echo "❌ Failed to update .env.production"
  exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "1. Commit the changes:"
echo "   git add .env.production"
echo "   git commit -m 'Configure CORS for Vercel frontend: $VERCEL_URL'"
echo ""
echo "2. Update back4app environment:"
echo "   - Go to https://back4app.com/dashboard"
echo "   - Select your app → Settings → Environment Variables"
echo "   - Update: ALLOWED_ORIGINS=$VERCEL_URL"
echo "   - Save and redeploy"
echo ""
echo "3. Test from frontend:"
echo "   - Open browser DevTools (F12)"
echo "   - Network tab"
echo "   - Try a search or API call"
echo "   - Verify response status is 200 (not CORS error)"
echo ""
echo "✅ CORS Configuration Complete"
