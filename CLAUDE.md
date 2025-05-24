# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension that provides scratch file functionality for creating and managing temporary scratch files within VSCode projects.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm build

# Watch mode for development
pnpm watch

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm check-types

# Package extension for production
pnpm package

# Clean build artifacts
pnpm clean
```

## Architecture

The extension follows a standard VSCode extension structure:
- Entry point: `src/extension.ts` - Contains the `activate()` and `deactivate()` functions
- Build system: Uses esbuild for fast bundling with watch mode support
- Module format: CommonJS (required for VSCode compatibility)
- TypeScript configuration: Strict mode enabled with target ES2021

Key functionality:
- Creates scratch files in a project-specific `.scratches` directory
- Provides commands accessible via Command Palette or keybindings
- Keybindings: `Cmd+Alt+S` (create scratch), `Cmd+Alt+O` (open scratch)

## Testing

Tests are located in `src/test/` and use the VSCode test runner. Run individual tests using the VSCode test explorer or `pnpm test`.