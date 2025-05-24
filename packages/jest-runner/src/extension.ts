import * as vscode from 'vscode';
import { JestTestParser } from './parser';
import { JestCodeLensProvider } from './codeLensProvider';
import { JestTestExplorer } from './testExplorer';
import { JestTestRunner } from './testRunner';
import { JestDebugConfigurationProvider } from './debugConfig';

export function activate(context: vscode.ExtensionContext) {
  console.log('Jest Runner extension is now active');

  const parser = new JestTestParser();
  const runner = new JestTestRunner(context);
  const testExplorer = new JestTestExplorer(parser, runner);

  // Register test explorer
  const treeView = vscode.window.createTreeView('jestTestExplorer', {
    treeDataProvider: testExplorer,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Register CodeLens provider
  const codeLensProvider = new JestCodeLensProvider(parser);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: 'javascript', pattern: '**/*.{test,spec}.{js,jsx}' },
        { language: 'typescript', pattern: '**/*.{test,spec}.{ts,tsx}' },
        { language: 'javascriptreact', pattern: '**/*.{test,spec}.{js,jsx}' },
        { language: 'typescriptreact', pattern: '**/*.{test,spec}.{ts,tsx}' },
      ],
      codeLensProvider
    )
  );

  // Register debug configuration provider
  const debugProvider = new JestDebugConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('node', debugProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'jest-runner.runTest',
      async (testName: string, testFile: string) => {
        await runner.runTest(testName, testFile);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'jest-runner.debugTest',
      async (testName: string, testFile: string) => {
        await runner.debugTest(testName, testFile);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jest-runner.runTestFile', async (uri?: vscode.Uri) => {
      const testFile = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
      if (testFile) {
        await runner.runTestFile(testFile);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jest-runner.debugTestFile', async (uri?: vscode.Uri) => {
      const testFile = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;
      if (testFile) {
        await runner.debugTestFile(testFile);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jest-runner.runAllTests', async () => {
      await runner.runAllTests();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jest-runner.refresh', () => {
      testExplorer.refresh();
      vscode.commands.executeCommand('codelens.refresh');
    })
  );

  // Watch for test file changes
  const testFileWatcher = vscode.workspace.createFileSystemWatcher(
    '**/*.{test,spec}.{js,jsx,ts,tsx}'
  );
  testFileWatcher.onDidChange(() => {
    testExplorer.refresh();
    vscode.commands.executeCommand('codelens.refresh');
  });
  testFileWatcher.onDidCreate(() => {
    testExplorer.refresh();
  });
  testFileWatcher.onDidDelete(() => {
    testExplorer.refresh();
  });
  context.subscriptions.push(testFileWatcher);

  // Initial refresh
  testExplorer.refresh();
}

export function deactivate() {}
