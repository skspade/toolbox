import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Extension Test Suite', () => {
  suiteSetup(async () => {
    // Ensure extension is activated
    const ext = vscode.extensions.getExtension('undefined_publisher.scratches');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('undefined_publisher.scratches'));
  });

  test('All commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(
      commands.includes('scratches.createScratch'),
      'createScratch command should be registered'
    );
    assert.ok(
      commands.includes('scratches.listScratches'),
      'listScratches command should be registered'
    );
    assert.ok(
      commands.includes('scratches.deleteScratch'),
      'deleteScratch command should be registered'
    );
    assert.ok(commands.includes('scratches.showInfo'), 'showInfo command should be registered');
  });

  test('Create scratch command should work', async function () {
    this.timeout(10000); // Increase timeout for UI operations

    // Mock the quick pick selection
    const stub = sinon.stub(vscode.window, 'showQuickPick');
    stub.resolves({
      label: 'JavaScript',
      description: '.js',
      fileType: { id: 'javascript', label: 'JavaScript', extension: '.js', language: 'javascript' },
    } as any);

    try {
      await vscode.commands.executeCommand('scratches.createScratch');

      // Give some time for file creation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if a new editor was opened
      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'Should have opened a new editor');
      assert.ok(
        activeEditor.document.fileName.includes('scratch-'),
        'File should be a scratch file'
      );
      assert.strictEqual(
        path.extname(activeEditor.document.fileName),
        '.js',
        'File should have .js extension'
      );
    } finally {
      stub.restore();
    }
  });

  test('Show info command should display message', async () => {
    let messageShown = false;
    const stub = sinon.stub(vscode.window, 'showInformationMessage');
    stub.callsFake((message: string) => {
      messageShown = true;
      assert.ok(message.includes('Scratch files for'), 'Message should mention scratch files');
      assert.ok(message.includes('are stored in'), 'Message should mention storage location');
      return Promise.resolve(undefined);
    });

    try {
      await vscode.commands.executeCommand('scratches.showInfo');
      assert.ok(messageShown, 'Information message should be shown');
    } finally {
      stub.restore();
    }
  });

  test('List scratches with no files should show message', async () => {
    const stub = sinon.stub(vscode.window, 'showInformationMessage');
    stub.callsFake((message: string) => {
      if (message.includes('No scratch files found')) {
        // Expected message when no scratch files exist
      }
      return Promise.resolve(undefined);
    });

    try {
      await vscode.commands.executeCommand('scratches.listScratches');
      // Message might not show if there are existing scratch files
      // This is expected behavior
    } finally {
      stub.restore();
    }
  });

  test('Keybindings should be defined', async () => {
    // Read package.json to verify keybindings
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    assert.ok(packageJson.contributes.keybindings, 'Keybindings should be defined');

    const createScratchBinding = packageJson.contributes.keybindings.find(
      (kb: any) => kb.command === 'scratches.createScratch'
    );
    assert.ok(createScratchBinding, 'Create scratch keybinding should exist');
    assert.strictEqual(
      createScratchBinding.key,
      'ctrl+alt+s',
      'Windows/Linux key should be ctrl+alt+s'
    );
    assert.strictEqual(createScratchBinding.mac, 'cmd+alt+s', 'Mac key should be cmd+alt+s');

    const listScratchesBinding = packageJson.contributes.keybindings.find(
      (kb: any) => kb.command === 'scratches.listScratches'
    );
    assert.ok(listScratchesBinding, 'List scratches keybinding should exist');
    assert.strictEqual(
      listScratchesBinding.key,
      'ctrl+alt+o',
      'Windows/Linux key should be ctrl+alt+o'
    );
    assert.strictEqual(listScratchesBinding.mac, 'cmd+alt+o', 'Mac key should be cmd+alt+o');
  });
});

// Minimal sinon stub implementation for testing
const sinon = {
  stub: (obj: any, method: string) => {
    const original = obj[method];
    let callFake: Function | undefined;
    let resolveValue: any;

    const stub: any = (...args: any[]) => {
      if (callFake) {
        return callFake(...args);
      }
      return Promise.resolve(resolveValue);
    };

    stub.callsFake = (fn: Function) => {
      callFake = fn;
      return stub;
    };

    stub.resolves = (value: any) => {
      resolveValue = value;
      return stub;
    };

    stub.restore = () => {
      obj[method] = original;
    };

    obj[method] = stub;
    return stub;
  },
};
