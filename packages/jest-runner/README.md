# Jest Runner Extension

A VSCode extension that provides WebStorm-like Jest test running capabilities.

## Features

### 1. Inline Run/Debug Buttons (CodeLens)

The extension adds clickable buttons above each test and describe block:

- **▶️ Run** - Runs the specific test or test suite
- **🐛 Debug** - Debugs the test with full breakpoint support

### 2. Test Explorer Tree View

A dedicated sidebar panel showing all Jest tests organized by file:

```
📁 Jest Tests
  └── 📄 example.test.js
      └── 📦 Math operations
          ├── 🧪 should add numbers correctly
          ├── 🧪 should subtract numbers correctly
          └── 📦 nested operations
              ├── 🧪 should multiply
              └── 🧪 should divide (skipped)
      ├── 🧪 standalone test
      └── 📦 String operations
          ├── 🧪 should concatenate strings (only)
          └── 🧪 should convert to uppercase
```

### 3. Multiple Ways to Run Tests

- Click inline buttons in the editor
- Click tests in the Test Explorer tree view
- Right-click context menu on test files
- Command palette commands:
  - `Jest Runner: Run Test`
  - `Jest Runner: Debug Test`
  - `Jest Runner: Run All Tests in File`
  - `Jest Runner: Debug All Tests in File`
  - `Jest Runner: Run All Tests`

### 4. Full Debug Support

- Set breakpoints in your test code
- Step through test execution
- Inspect variables and call stack
- Automatic Jest configuration for debugging

## Installation

1. Build the extension:

   ```bash
   pnpm install
   pnpm build
   ```

2. Package for installation:

   ```bash
   pnpm package
   ```

3. Install the generated `.vsix` file in VSCode

## Usage

1. Open a project with Jest tests
2. Open any `.test.js`, `.spec.js`, `.test.ts`, or `.spec.ts` file
3. You'll see Run/Debug buttons above each test
4. Click to run or debug individual tests or entire suites

## Configuration

The extension provides several configuration options:

```json
{
  "jest-runner.jestPath": "", // Path to Jest executable (auto-detected)
  "jest-runner.projectPath": "", // Project root path (auto-detected)
  "jest-runner.configPath": "", // Jest config file (auto-detected)
  "jest-runner.showCodeLens": true, // Show inline run/debug buttons
  "jest-runner.debugOptions": {
    // Debug configuration
    "args": ["--runInBand", "--no-cache", "--no-coverage"],
    "console": "integratedTerminal",
    "internalConsoleOptions": "neverOpen"
  }
}
```

## Technical Details

The extension consists of:

- **Parser** - Detects and parses Jest test files
- **CodeLens Provider** - Adds inline run/debug buttons
- **Test Explorer** - Provides tree view of all tests
- **Test Runner** - Executes tests in terminal or debug mode
- **Debug Configuration** - Sets up proper Jest debugging

## Example Test Detection

Given the example test file, the parser identifies:

- 2 describe blocks (with 1 nested)
- 7 individual tests
- Test modifiers (.only, .skip)
- Full test paths for precise execution
