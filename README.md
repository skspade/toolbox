# VSCode Extensions Monorepo

This is a monorepo containing multiple VSCode extensions.

## Structure

```
.
├── packages/          # VSCode extension packages
│   ├── scratches/    # Scratches extension
│   ├── jest-runner/  # Jest runner extension
│   └── nvm-auto-switch/ # NVM Auto Switch extension
├── shared/           # Shared utilities and libraries
└── pnpm-workspace.yaml
```

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

```bash
# Install dependencies
pnpm install

# Build all extensions
pnpm build

# Watch mode for development
pnpm watch

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm check-types
```

### Adding a New Extension

1. Create a new directory in `packages/`:

   ```bash
   mkdir packages/my-new-extension
   ```

2. Copy the structure from an existing extension or create from scratch
3. Add the extension's `package.json` with proper VSCode extension metadata
4. Run `pnpm install` from the root to link everything

### Publishing

Each extension can be published independently:

```bash
cd packages/my-extension
pnpm run package
# Then use vsce to publish
```

## Extensions

### Scratches

Create and manage scratch files of any type in a dedicated `.scratches`
directory within your project.

### Jest Runner

Run and debug Jest tests with WebStorm-like functionality:

- Inline run/debug buttons above each test
- Test explorer tree view in the sidebar
- Full debugging support with breakpoints
- Support for test modifiers (.only, .skip)
- Multiple ways to run tests (buttons, tree view, commands)

### NVM Auto Switch

Automatically switch Node.js versions using nvm based on `.nvmrc` files:

- Automatic detection and switching when opening projects
- File watching for `.nvmrc` changes
- Manual command to trigger version switching
- Configurable notifications
