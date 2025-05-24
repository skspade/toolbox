# NVM Auto Switch

Automatically switch Node.js versions using nvm based on `.nvmrc` files in your
VSCode workspace.

## Features

- **Automatic Version Switching**: Detects `.nvmrc` files in your workspace and
  prompts to switch Node.js versions
- **File Watching**: Monitors for changes to `.nvmrc` files and responds
  accordingly
- **Manual Command**: Use the command palette to manually trigger version
  switching
- **Configurable Notifications**: Control whether to show notifications when
  switching versions

## Requirements

- [nvm](https://github.com/nvm-sh/nvm) must be installed on your system
- A `.nvmrc` file in your project root with the desired Node.js version

## Extension Settings

This extension contributes the following settings:

- `nvm-auto-switch.enable`: Enable/disable automatic Node.js version switching
  (default: `true`)
- `nvm-auto-switch.showNotifications`: Show notifications when switching
  versions (default: `true`)

## Commands

- `NVM: Switch to Project Node Version`: Manually trigger Node.js version
  switching based on `.nvmrc`

## Usage

1. Create a `.nvmrc` file in your project root with your desired Node.js version
   (e.g., `16.14.0` or `lts/fermium`)
2. Open the project in VSCode
3. The extension will detect the `.nvmrc` file and prompt you to switch versions
4. Accept the prompt to switch to the specified version

## Known Issues

- The extension creates a temporary terminal to execute the nvm commands, which
  briefly appears and disappears
- Version switching affects only new terminal sessions within VSCode

## Release Notes

### 0.0.1

Initial release with basic automatic Node.js version switching functionality.
