#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building and installing all extensions to Cursor...${NC}"

# Find cursor command
if command -v cursor &> /dev/null; then
    CURSOR_CMD="cursor"
elif command -v code &> /dev/null; then
    # Fallback to code if cursor is not found
    echo -e "${BLUE}Warning: 'cursor' command not found, using 'code' instead${NC}"
    CURSOR_CMD="code"
else
    echo "Error: Neither 'cursor' nor 'code' command found in PATH"
    exit 1
fi

# Build all extensions
echo -e "${BLUE}Building all extensions...${NC}"
pnpm build

# Package and install each extension
for package_dir in packages/*/; do
    if [ -d "$package_dir" ]; then
        package_name=$(basename "$package_dir")
        echo -e "${BLUE}Processing $package_name...${NC}"
        
        cd "$package_dir"
        
        # Package the extension
        echo "  Packaging..."
        pnpm package
        
        # Find the generated vsix file
        vsix_file=$(ls *.vsix 2>/dev/null | head -n 1)
        
        if [ -n "$vsix_file" ]; then
            echo "  Installing $vsix_file to Cursor..."
            $CURSOR_CMD --install-extension "$vsix_file"
            echo -e "${GREEN}  ✓ $package_name installed successfully${NC}"
        else
            echo "  Warning: No .vsix file found for $package_name"
        fi
        
        cd ../..
    fi
done

echo -e "${GREEN}All extensions have been built and installed!${NC}"
echo "You may need to reload Cursor for the extensions to take effect."