#!/bin/bash

# Build script for AI Translator extension
# Creates distributable ZIP files for Chrome and Firefox

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Files to include in the extension package
FILES=(
    "background.js"
    "content.js"
    "options.js"
    "options.html"
    "styles.css"
    "options.css"
    "tailwindcss.min.js"
    "images"
)

# Clean up previous builds
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf dist
mkdir -p dist/chrome dist/firefox

# Build Chrome extension
echo -e "${BLUE}Building Chrome extension...${NC}"
cp manifest.json dist/chrome/
for file in "${FILES[@]}"; do
    cp -r "$file" dist/chrome/
done

# Create Chrome ZIP
cd dist/chrome
zip -r ../ai-translator-chrome.zip . -x "*.DS_Store"
cd ../..
echo -e "${GREEN}Created: dist/ai-translator-chrome.zip${NC}"

# Build Firefox extension
echo -e "${BLUE}Building Firefox extension...${NC}"
cp manifest.firefox.json dist/firefox/manifest.json
for file in "${FILES[@]}"; do
    cp -r "$file" dist/firefox/
done

# Create Firefox ZIP
cd dist/firefox
zip -r ../ai-translator-firefox.zip . -x "*.DS_Store"
cd ../..
echo -e "${GREEN}Created: dist/ai-translator-firefox.zip${NC}"

echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Chrome extension: dist/ai-translator-chrome.zip"
echo "Firefox extension: dist/ai-translator-firefox.zip"
echo ""
echo "To test Firefox locally:"
echo "  1. Open Firefox and go to about:debugging"
echo "  2. Click 'This Firefox' on the left"
echo "  3. Click 'Load Temporary Add-on...'"
echo "  4. Select dist/firefox/manifest.json"
