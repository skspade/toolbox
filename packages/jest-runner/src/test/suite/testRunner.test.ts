import assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { JestTestRunner } from '../../testRunner';
import * as path from 'path';

suite('JestTestRunner Test Suite', () => {
  let runner: JestTestRunner;
  let sandbox: sinon.SinonSandbox;
  let terminalStub: vscode.Terminal;
  let windowStub: sinon.SinonStub;
  let debugStub: sinon.SinonStub;
  let workspaceStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();

    // Mock terminal
    terminalStub = {
      show: sandbox.stub(),
      sendText: sandbox.stub(),
      exitStatus: undefined,
    } as any;

    // Mock vscode.window
    windowStub = sandbox.stub(vscode.window, 'createTerminal').returns(terminalStub);
    sandbox.stub(vscode.window, 'showErrorMessage');

    // Mock vscode.debug
    debugStub = sandbox.stub(vscode.debug, 'startDebugging').resolves(true);

    // Mock vscode.workspace
    workspaceStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
      get: (key: string) => {
        if (key === 'jestPath') return '';
        return undefined;
      },
    } as any);

    const mockContext = {
      subscriptions: [],
    } as any;

    runner = new JestTestRunner(mockContext);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should run a single test', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      {
        uri: { fsPath: '/workspace' },
      },
    ]);

    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.runTest('my test', '/workspace/test.spec.js');

    assert(terminalStub.show.calledOnce);
    assert(terminalStub.sendText.calledOnce);

    const command = terminalStub.sendText.getCall(0).args[0];
    assert(command.includes('test.spec.js'));
    assert(command.includes('--testNamePattern'));
    assert(command.includes('my test'));
    assert(command.includes('--no-coverage'));
  });

  test('should escape regex special characters in test names', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      {
        uri: { fsPath: '/workspace' },
      },
    ]);

    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.runTest('test with $pecial (characters)', '/workspace/test.spec.js');

    const command = terminalStub.sendText.getCall(0).args[0];
    assert(command.includes('test with \\$pecial \\(characters\\)'));
  });

  test('should debug a single test', async () => {
    const mockWorkspaceFolder = {
      uri: { fsPath: '/workspace' },
    };

    sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);
    sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns(mockWorkspaceFolder as any);
    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.debugTest('my test', '/workspace/test.spec.js');

    assert(debugStub.calledOnce);

    const [folder, config] = debugStub.getCall(0).args;
    assert.strictEqual(folder, mockWorkspaceFolder);
    assert.strictEqual(config.type, 'node');
    assert.strictEqual(config.request, 'launch');
    assert.strictEqual(config.name, 'Debug Jest: my test');
    assert(config.args.includes('--runInBand'));
    assert(config.args.includes('--no-cache'));
    assert(config.args.includes('--no-coverage'));
    assert.strictEqual(config.console, 'integratedTerminal');
  });

  test('should run all tests in a file', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      {
        uri: { fsPath: '/workspace' },
      },
    ]);

    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.runTestFile('/workspace/test.spec.js');

    assert(terminalStub.show.calledOnce);
    assert(terminalStub.sendText.calledOnce);

    const command = terminalStub.sendText.getCall(0).args[0];
    assert(command.includes('test.spec.js'));
    assert(command.includes('--no-coverage'));
    assert(!command.includes('--testNamePattern'));
  });

  test('should debug all tests in a file', async () => {
    const mockWorkspaceFolder = {
      uri: { fsPath: '/workspace' },
    };

    sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);
    sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns(mockWorkspaceFolder as any);
    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.debugTestFile('/workspace/test.spec.js');

    assert(debugStub.calledOnce);

    const [folder, config] = debugStub.getCall(0).args;
    assert.strictEqual(config.name, 'Debug Jest File: test.spec.js');
    assert(config.args.includes('/workspace/test.spec.js'));
    assert(!config.args.some((arg: string) => arg.includes('--testNamePattern')));
  });

  test('should run all tests', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      {
        uri: { fsPath: '/workspace' },
      },
    ]);

    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.runAllTests();

    assert(terminalStub.show.calledOnce);
    assert(terminalStub.sendText.calledOnce);

    const command = terminalStub.sendText.getCall(0).args[0];
    assert(command.endsWith('jest') || command.includes('jest'));
    assert(!command.includes('--testNamePattern'));
  });

  test('should show error when Jest is not found', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
    const errorStub = vscode.window.showErrorMessage as sinon.SinonStub;

    await runner.runTest('test', '/test.js');

    assert(errorStub.calledOnce);
    assert(errorStub.getCall(0).args[0].includes('Jest not found'));
  });

  test('should use configured jest path', async () => {
    workspaceStub.returns({
      get: (key: string) => {
        if (key === 'jestPath') return '/custom/jest';
        return undefined;
      },
    } as any);

    await runner.runTest('test', '/test.js');

    const command = terminalStub.sendText.getCall(0).args[0];
    assert(command.startsWith('/custom/jest'));
  });

  test('should reuse existing terminal', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      {
        uri: { fsPath: '/workspace' },
      },
    ]);

    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.runTest('test1', '/test.js');
    await runner.runTest('test2', '/test.js');

    // Should only create one terminal
    assert(windowStub.calledOnce);
    assert(terminalStub.sendText.calledTwice);
  });

  test('should create new terminal if previous was closed', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      {
        uri: { fsPath: '/workspace' },
      },
    ]);

    sandbox.stub(vscode.workspace.fs, 'stat').resolves();

    await runner.runTest('test1', '/test.js');

    // Simulate terminal being closed
    terminalStub.exitStatus = { code: 0 };

    await runner.runTest('test2', '/test.js');

    // Should create two terminals
    assert(windowStub.calledTwice);
  });

  test('should handle workspace folder not found for debug', async () => {
    sandbox.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
    const errorStub = vscode.window.showErrorMessage as sinon.SinonStub;

    await runner.debugTest('test', '/test.js');

    assert(errorStub.calledOnce);
    assert(errorStub.getCall(0).args[0].includes('No workspace folder found'));
    assert(debugStub.notCalled);
  });
});
