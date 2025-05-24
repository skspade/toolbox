import assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activate, deactivate } from '../../extension';

suite('Extension Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;
  let registerCommandStub: sinon.SinonStub;
  let registerCodeLensStub: sinon.SinonStub;
  let registerDebugStub: sinon.SinonStub;
  let createTreeViewStub: sinon.SinonStub;
  let createFileSystemWatcherStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();

    mockContext = {
      subscriptions: [],
    } as any;

    // Stub vscode API methods
    registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
    registerCodeLensStub = sandbox.stub(vscode.languages, 'registerCodeLensProvider');
    registerDebugStub = sandbox.stub(vscode.debug, 'registerDebugConfigurationProvider');
    createTreeViewStub = sandbox.stub(vscode.window, 'createTreeView');
    createFileSystemWatcherStub = sandbox.stub(vscode.workspace, 'createFileSystemWatcher');

    // Mock file system watcher
    const mockWatcher = {
      onDidChange: sandbox.stub(),
      onDidCreate: sandbox.stub(),
      onDidDelete: sandbox.stub(),
      dispose: sandbox.stub(),
    };
    createFileSystemWatcherStub.returns(mockWatcher);

    // Mock tree view
    createTreeViewStub.returns({
      dispose: sandbox.stub(),
    });
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('jest-runner'));
  });

  test('should register all commands on activation', () => {
    activate(mockContext);

    // Verify commands are registered
    const commandNames = [
      'jest-runner.runTest',
      'jest-runner.debugTest',
      'jest-runner.runTestFile',
      'jest-runner.debugTestFile',
      'jest-runner.runAllTests',
      'jest-runner.refresh',
    ];

    commandNames.forEach((command, index) => {
      assert(
        registerCommandStub.getCall(index).args[0] === command,
        `Command ${command} should be registered`
      );
    });

    assert.strictEqual(registerCommandStub.callCount, commandNames.length);
  });

  test('should register code lens provider', () => {
    activate(mockContext);

    assert(registerCodeLensStub.calledOnce);

    const [selector, provider] = registerCodeLensStub.getCall(0).args;

    // Check selector includes test file patterns
    assert(Array.isArray(selector));
    assert(selector.some((s: any) => s.pattern.includes('.test.')));
    assert(selector.some((s: any) => s.pattern.includes('.spec.')));

    // Check languages
    assert(selector.some((s: any) => s.language === 'javascript'));
    assert(selector.some((s: any) => s.language === 'typescript'));
    assert(selector.some((s: any) => s.language === 'javascriptreact'));
    assert(selector.some((s: any) => s.language === 'typescriptreact'));
  });

  test('should register debug configuration provider', () => {
    activate(mockContext);

    assert(registerDebugStub.calledOnce);
    assert.strictEqual(registerDebugStub.getCall(0).args[0], 'node');
  });

  test('should create tree view', () => {
    activate(mockContext);

    assert(createTreeViewStub.calledOnce);

    const [viewId, options] = createTreeViewStub.getCall(0).args;
    assert.strictEqual(viewId, 'jestTestExplorer');
    assert(options.treeDataProvider);
    assert.strictEqual(options.showCollapseAll, true);
  });

  test('should register file watcher for test files', () => {
    activate(mockContext);

    assert(createFileSystemWatcherStub.calledOnce);

    const pattern = createFileSystemWatcherStub.getCall(0).args[0];
    assert(pattern.includes('.test.') || pattern.includes('.spec.'));
  });

  test('should add all disposables to subscriptions', () => {
    activate(mockContext);

    // Should have added multiple items to subscriptions
    assert(mockContext.subscriptions.length > 0);

    // Check that subscriptions include various types
    const hasTreeView = mockContext.subscriptions.some((s) =>
      createTreeViewStub.returnValues.includes(s)
    );
    const hasCommands = mockContext.subscriptions.some((s) =>
      registerCommandStub.returnValues.includes(s)
    );

    assert(hasTreeView || hasCommands);
  });

  test('should handle run test command', async () => {
    activate(mockContext);

    // Get the run test command handler
    const runTestCommand = registerCommandStub
      .getCalls()
      .find((call) => call.args[0] === 'jest-runner.runTest');

    assert(runTestCommand);

    const handler = runTestCommand.args[1];
    assert(typeof handler === 'function');

    // Test that handler can be called without error
    await assert.doesNotReject(async () => {
      await handler('test name', '/path/to/test.js');
    });
  });

  test('should handle debug test command', async () => {
    activate(mockContext);

    // Get the debug test command handler
    const debugTestCommand = registerCommandStub
      .getCalls()
      .find((call) => call.args[0] === 'jest-runner.debugTest');

    assert(debugTestCommand);

    const handler = debugTestCommand.args[1];
    assert(typeof handler === 'function');

    // Test that handler can be called without error
    await assert.doesNotReject(async () => {
      await handler('test name', '/path/to/test.js');
    });
  });

  test('should handle refresh command', async () => {
    sandbox.stub(vscode.commands, 'executeCommand').resolves();

    activate(mockContext);

    // Get the refresh command handler
    const refreshCommand = registerCommandStub
      .getCalls()
      .find((call) => call.args[0] === 'jest-runner.refresh');

    assert(refreshCommand);

    const handler = refreshCommand.args[1];
    await handler();

    // Should trigger codelens refresh
    assert((vscode.commands.executeCommand as sinon.SinonStub).calledWith('codelens.refresh'));
  });

  test('should setup file watcher callbacks', () => {
    activate(mockContext);

    const watcher = createFileSystemWatcherStub.returnValues[0];

    // Check that callbacks are registered
    assert(watcher.onDidChange.calledOnce);
    assert(watcher.onDidCreate.calledOnce);
    assert(watcher.onDidDelete.calledOnce);

    // All callbacks should be functions
    assert(typeof watcher.onDidChange.getCall(0).args[0] === 'function');
    assert(typeof watcher.onDidCreate.getCall(0).args[0] === 'function');
    assert(typeof watcher.onDidDelete.getCall(0).args[0] === 'function');
  });

  test('deactivate should clean up resources', () => {
    activate(mockContext);

    const watcher = createFileSystemWatcherStub.returnValues[0];

    deactivate();

    // File watcher should be disposed
    assert(watcher.dispose.calledOnce);
  });

  test('deactivate should handle missing watcher gracefully', () => {
    // Don't activate, so watcher is not created
    assert.doesNotThrow(() => {
      deactivate();
    });
  });
});
