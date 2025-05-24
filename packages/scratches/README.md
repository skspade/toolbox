# VSCode Scratches

A JetBrains-style scratch files extension for Visual Studio Code and Cursor IDE. Create temporary code snippets in any language without cluttering your project.

## Features

- **Quick Creation**: Press `Ctrl+Alt+S` (Windows/Linux) or `Cmd+Alt+S` (Mac) to create a new scratch file
- **25+ Languages**: Support for JavaScript, TypeScript, Python, Java, C++, Go, Rust, and many more
- **Smart Templates**: Pre-configured boilerplate code for languages that need it
- **Project Isolation**: Each project gets its own scratch files directory
- **File Management**: List, open, and bulk delete scratch files

## Usage

### Create a Scratch File
- Press `Ctrl+Alt+S` (Windows/Linux) or `Cmd+Alt+S` (Mac)
- Select a language from the quick pick menu
- Start coding immediately with smart cursor positioning

### List Scratch Files
- Press `Ctrl+Alt+O` (Windows/Linux) or `Cmd+Alt+O` (Mac)
- Select a scratch file to open it

### Other Commands
- **Delete Scratch Files**: Use Command Palette → "Scratches: Delete Scratch Files"
- **Show Storage Location**: Use Command Palette → "Scratches: Show Scratch Files Location"

## Storage

Scratch files are stored in:
- `~/.vscode-scratches/[project-name]-[hash]/`
- Each project has its own isolated directory
- Files are named with timestamps for easy identification

## Supported Languages

JavaScript, TypeScript, Python, Java, C#, C++, C, Go, Rust, Ruby, PHP, Swift, Kotlin, HTML, CSS, SCSS, JSON, YAML, XML, Markdown, SQL, Shell Script, PowerShell, Dockerfile, and Plain Text.

## Requirements

- VS Code 1.100.0 or higher
- Works with Cursor IDE

## Release Notes

### 0.0.1

Initial release with core scratch file functionality.
