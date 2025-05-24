# CLAUDE.md - Jest Runner Extension

This file provides guidance to Claude Code (claude.ai/code) when working with the Jest Runner extension.

## Extension Overview

The Jest Runner extension provides WebStorm-like Jest test running and debugging capabilities within VSCode. It allows developers to run and debug individual tests or test suites with a single click, similar to JetBrains IDEs.

## Key Components

### 1. Parser (`src/parser.ts`)
- Parses Jest test files to extract test structure
- Detects `describe`, `test`, `it` blocks and their modifiers (.only, .skip)
- Builds a hierarchical representation of tests
- Caches parsed results for performance

### 2. CodeLens Provider (`src/codeLensProvider.ts`)
- Adds inline "Run" and "Debug" buttons above each test
- Integrates with VSCode's CodeLens API
- Refreshes when test files change

### 3. Test Runner (`src/testRunner.ts`)
- Executes Jest tests in terminal or debug mode
- Manages terminal instances
- Finds Jest executable automatically
- Handles test name escaping for regex matching

### 4. Debug Configuration (`src/debugConfig.ts`)
- Provides Jest-specific debug configurations
- Ensures proper settings for breakpoint debugging
- Adds --runInBand flag for sequential test execution

### 5. Test Explorer (`src/testExplorer.ts`)
- Implements tree view showing all tests organized by file
- Provides icons and context menus
- Allows navigation to test locations

## Development Guidelines

### Testing
- Unit tests use Mocha framework with Sinon for mocking
- VSCode APIs are stubbed for testing
- Tests focus on parsing logic, command handling, and tree structure

### Adding Features
When adding new features:
1. Update parser if new test syntax needs support
2. Add commands to package.json and register in extension.ts
3. Update CodeLens or Test Explorer as needed
4. Add corresponding tests

### Known Patterns
- Test names can contain special characters that need regex escaping
- Debug mode requires --runInBand to work with breakpoints
- Terminal reuse is important for performance
- File watchers trigger refreshes of both CodeLens and tree view

## Common Issues

1. **Jest not found**: The extension tries multiple paths to find Jest
2. **Breakpoints not working**: Ensure --runInBand is included in debug args
3. **Tests not detected**: Check regex patterns in parser match the test syntax

## Future Enhancements
- Support for Jest configuration files
- Test coverage visualization
- Running tests with custom arguments
- Integration with Jest's watch mode