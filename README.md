# VSCode Extensions Monorepo

This is a monorepo containing multiple VSCode extensions.

## Structure

```
.
├── packages/          # VSCode extension packages
│   └── scratches/    # Scratches extension
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

- **Scratches** - Create and manage scratch files of any type