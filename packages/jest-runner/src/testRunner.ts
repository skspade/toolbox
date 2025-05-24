import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export class JestTestRunner {
  private terminals = new Map<string, vscode.Terminal>();

  constructor(private context: vscode.ExtensionContext) {}

  async runTest(testName: string, testFile: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('jest-runner');
    const jestPath = await this.findJestPath();

    if (!jestPath) {
      vscode.window.showErrorMessage(
        'Jest not found. Please install Jest or configure jest-runner.jestPath'
      );
      return;
    }

    const args = [testFile, '--testNamePattern', this.escapeRegExp(testName), '--no-coverage'];

    const terminal = this.getOrCreateTerminal('Jest Test Runner');
    terminal.show();
    terminal.sendText(`${jestPath} ${args.join(' ')}`);
  }

  async debugTest(testName: string, testFile: string): Promise<void> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(testFile));
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found for test file');
      return;
    }

    const config: vscode.DebugConfiguration = {
      type: 'node',
      request: 'launch',
      name: `Debug Jest: ${testName}`,
      program: (await this.findJestPath()) || 'jest',
      args: [
        testFile,
        '--testNamePattern',
        this.escapeRegExp(testName),
        '--runInBand',
        '--no-cache',
        '--no-coverage',
      ],
      console: 'integratedTerminal',
      internalConsoleOptions: 'neverOpen',
      cwd: workspaceFolder.uri.fsPath,
      env: {
        NODE_ENV: 'test',
      },
    };

    await vscode.debug.startDebugging(workspaceFolder, config);
  }

  async runTestFile(testFile: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('jest-runner');
    const jestPath = await this.findJestPath();

    if (!jestPath) {
      vscode.window.showErrorMessage(
        'Jest not found. Please install Jest or configure jest-runner.jestPath'
      );
      return;
    }

    const args = [testFile, '--no-coverage'];

    const terminal = this.getOrCreateTerminal('Jest Test Runner');
    terminal.show();
    terminal.sendText(`${jestPath} ${args.join(' ')}`);
  }

  async debugTestFile(testFile: string): Promise<void> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(testFile));
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found for test file');
      return;
    }

    const config: vscode.DebugConfiguration = {
      type: 'node',
      request: 'launch',
      name: `Debug Jest File: ${path.basename(testFile)}`,
      program: (await this.findJestPath()) || 'jest',
      args: [testFile, '--runInBand', '--no-cache', '--no-coverage'],
      console: 'integratedTerminal',
      internalConsoleOptions: 'neverOpen',
      cwd: workspaceFolder.uri.fsPath,
      env: {
        NODE_ENV: 'test',
      },
    };

    await vscode.debug.startDebugging(workspaceFolder, config);
  }

  async runAllTests(): Promise<void> {
    const jestPath = await this.findJestPath();

    if (!jestPath) {
      vscode.window.showErrorMessage(
        'Jest not found. Please install Jest or configure jest-runner.jestPath'
      );
      return;
    }

    const terminal = this.getOrCreateTerminal('Jest Test Runner');
    terminal.show();
    terminal.sendText(jestPath);
  }

  private async findJestPath(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('jest-runner');
    const configuredPath = config.get<string>('jestPath');

    if (configuredPath) {
      return configuredPath;
    }

    // Try to find Jest in node_modules
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return null;
    }

    for (const folder of workspaceFolders) {
      const jestPaths = [
        path.join(folder.uri.fsPath, 'node_modules', '.bin', 'jest'),
        path.join(folder.uri.fsPath, 'node_modules', 'jest', 'bin', 'jest.js'),
      ];

      for (const jestPath of jestPaths) {
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(jestPath));
          return jestPath;
        } catch (e) {
          // File doesn't exist, continue
        }
      }
    }

    // Try global jest
    return 'jest';
  }

  private getOrCreateTerminal(name: string): vscode.Terminal {
    let terminal = this.terminals.get(name);

    if (!terminal || terminal.exitStatus !== undefined) {
      terminal = vscode.window.createTerminal(name);
      this.terminals.set(name, terminal);

      // Clean up when terminal is closed
      const disposable = vscode.window.onDidCloseTerminal((t) => {
        if (t === terminal) {
          this.terminals.delete(name);
          disposable.dispose();
        }
      });

      this.context.subscriptions.push(disposable);
    }

    return terminal;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
