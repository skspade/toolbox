import * as vscode from 'vscode';
import * as path from 'path';

export class JestDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    // If the configuration is missing required fields, fill them in
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (editor && this.isTestFile(editor.document.fileName)) {
        config.type = 'node';
        config.request = 'launch';
        config.name = 'Debug Jest Tests';
        config.program = '${workspaceFolder}/node_modules/.bin/jest';
        config.args = ['${file}', '--runInBand', '--no-cache', '--no-coverage'];
        config.console = 'integratedTerminal';
        config.internalConsoleOptions = 'neverOpen';
        config.cwd = '${workspaceFolder}';
        config.env = { NODE_ENV: 'test' };
      }
    }

    // Ensure proper Jest debug settings
    if (config.type === 'node' && config.name && config.name.includes('Jest')) {
      // Ensure runInBand is set for debugging
      if (Array.isArray(config.args) && !config.args.includes('--runInBand')) {
        config.args.push('--runInBand');
      }

      // Set up source maps
      if (!config.sourceMaps) {
        config.sourceMaps = true;
      }

      // Set up proper console
      if (!config.console) {
        config.console = 'integratedTerminal';
      }

      // Ensure breakpoints work in TypeScript
      if (!config.resolveSourceMapLocations) {
        config.resolveSourceMapLocations = ['${workspaceFolder}/**', '!**/node_modules/**'];
      }
    }

    return config;
  }

  provideDebugConfigurations(
    folder: vscode.WorkspaceFolder | undefined,
    token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
    return [
      {
        type: 'node',
        request: 'launch',
        name: 'Debug Jest Current File',
        program: '${workspaceFolder}/node_modules/.bin/jest',
        args: ['${file}', '--runInBand', '--no-cache', '--no-coverage'],
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        cwd: '${workspaceFolder}',
        env: {
          NODE_ENV: 'test',
        },
        sourceMaps: true,
        resolveSourceMapLocations: ['${workspaceFolder}/**', '!**/node_modules/**'],
      },
      {
        type: 'node',
        request: 'launch',
        name: 'Debug Jest All Tests',
        program: '${workspaceFolder}/node_modules/.bin/jest',
        args: ['--runInBand', '--no-cache', '--no-coverage'],
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        cwd: '${workspaceFolder}',
        env: {
          NODE_ENV: 'test',
        },
        sourceMaps: true,
        resolveSourceMapLocations: ['${workspaceFolder}/**', '!**/node_modules/**'],
      },
    ];
  }

  private isTestFile(fileName: string): boolean {
    return /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(fileName);
  }
}
