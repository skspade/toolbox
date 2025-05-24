import assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { JestTestExplorer } from '../../testExplorer';
import { JestTestParser, JestTest } from '../../parser';
import { JestTestRunner } from '../../testRunner';

suite('JestTestExplorer Test Suite', () => {
  let explorer: JestTestExplorer;
  let parserStub: sinon.SinonStubbedInstance<JestTestParser>;
  let runnerStub: sinon.SinonStubbedInstance<JestTestRunner>;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    parserStub = sandbox.createStubInstance(JestTestParser);
    runnerStub = sandbox.createStubInstance(JestTestRunner);
    explorer = new JestTestExplorer(parserStub as any, runnerStub as any);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should get root level test files', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/math.test.js',
        [
          {
            name: 'Math tests',
            fullName: 'Math tests',
            type: 'describe',
            file: '/workspace/math.test.js',
            line: 0,
            column: 0,
            children: [],
          },
        ],
      ],
      [
        '/workspace/string.test.js',
        [
          {
            name: 'String tests',
            fullName: 'String tests',
            type: 'describe',
            file: '/workspace/string.test.js',
            line: 0,
            column: 0,
            children: [],
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    const children = await explorer.getChildren();

    assert.strictEqual(children.length, 2);
    assert.strictEqual(children[0].label, 'math.test.js');
    assert.strictEqual(children[1].label, 'string.test.js');

    // Check that file items have correct properties
    const fileItem = children[0];
    assert.strictEqual(fileItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
    assert.strictEqual(fileItem.contextValue, 'testFile');
  });

  test('should get children of a file item', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/test.js',
        [
          {
            name: 'Suite 1',
            fullName: 'Suite 1',
            type: 'describe',
            file: '/workspace/test.js',
            line: 0,
            column: 0,
            children: [
              {
                name: 'test 1',
                fullName: 'Suite 1 › test 1',
                type: 'test',
                file: '/workspace/test.js',
                line: 1,
                column: 4,
              },
            ],
          },
          {
            name: 'test 2',
            fullName: 'test 2',
            type: 'test',
            file: '/workspace/test.js',
            line: 5,
            column: 0,
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    // Get root children first
    const rootChildren = await explorer.getChildren();
    const fileItem = rootChildren[0];

    // Get children of the file
    const fileChildren = await explorer.getChildren(fileItem);

    assert.strictEqual(fileChildren.length, 2);
    assert.strictEqual(fileChildren[0].label, 'Suite 1');
    assert.strictEqual(fileChildren[1].label, 'test 2');
  });

  test('should create correct tree items for different test types', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/test.js',
        [
          {
            name: 'describe block',
            fullName: 'describe block',
            type: 'describe',
            file: '/workspace/test.js',
            line: 0,
            column: 0,
            children: [],
          },
          {
            name: 'test case',
            fullName: 'test case',
            type: 'test',
            file: '/workspace/test.js',
            line: 5,
            column: 0,
          },
          {
            name: 'it case',
            fullName: 'it case',
            type: 'it',
            file: '/workspace/test.js',
            line: 10,
            column: 0,
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    const rootChildren = await explorer.getChildren();
    const fileChildren = await explorer.getChildren(rootChildren[0]);

    // Check describe block
    const describeItem = fileChildren[0];
    assert.strictEqual(describeItem.contextValue, 'testSuite');
    assert.strictEqual((describeItem.iconPath as vscode.ThemeIcon).id, 'symbol-class');
    assert.strictEqual(describeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);

    // Check test case
    const testItem = fileChildren[1];
    assert.strictEqual(testItem.contextValue, 'test');
    assert.strictEqual((testItem.iconPath as vscode.ThemeIcon).id, 'beaker');
    assert.strictEqual(testItem.collapsibleState, vscode.TreeItemCollapsibleState.None);

    // Check it case
    const itItem = fileChildren[2];
    assert.strictEqual(itItem.contextValue, 'test');
    assert.strictEqual((itItem.iconPath as vscode.ThemeIcon).id, 'beaker');
  });

  test('should handle nested test structure', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/nested.test.js',
        [
          {
            name: 'Outer',
            fullName: 'Outer',
            type: 'describe',
            file: '/workspace/nested.test.js',
            line: 0,
            column: 0,
            children: [
              {
                name: 'Inner',
                fullName: 'Outer › Inner',
                type: 'describe',
                file: '/workspace/nested.test.js',
                line: 1,
                column: 4,
                children: [
                  {
                    name: 'deep test',
                    fullName: 'Outer › Inner › deep test',
                    type: 'test',
                    file: '/workspace/nested.test.js',
                    line: 2,
                    column: 8,
                  },
                ],
              },
            ],
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    const rootChildren = await explorer.getChildren();
    const fileChildren = await explorer.getChildren(rootChildren[0]);
    const outerChildren = await explorer.getChildren(fileChildren[0]);
    const innerChildren = await explorer.getChildren(outerChildren[0]);

    assert.strictEqual(innerChildren.length, 1);
    assert.strictEqual(innerChildren[0].label, 'deep test');
    assert.strictEqual(innerChildren[0].fullName, 'Outer › Inner › deep test');
  });

  test('should refresh tree data', () => {
    let eventFired = false;
    explorer.onDidChangeTreeData(() => {
      eventFired = true;
    });

    explorer.refresh();

    assert(parserStub.clearCache.calledOnce);
    assert(eventFired);
  });

  test('should return empty array when no tests found', async () => {
    parserStub.getAllTests.resolves(new Map());

    const children = await explorer.getChildren();

    assert.strictEqual(children.length, 0);
  });

  test('should set command for navigation to test location', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/test.js',
        [
          {
            name: 'test with location',
            fullName: 'test with location',
            type: 'test',
            file: '/workspace/test.js',
            line: 10,
            column: 4,
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    const rootChildren = await explorer.getChildren();
    const fileChildren = await explorer.getChildren(rootChildren[0]);
    const testItem = fileChildren[0];

    assert(testItem.command);
    assert.strictEqual(testItem.command.command, 'vscode.open');
    assert.strictEqual(testItem.command.arguments![0].fsPath, '/workspace/test.js');

    const range = testItem.command.arguments![1].selection;
    assert.strictEqual(range.start.line, 10);
    assert.strictEqual(range.start.character, 0);
  });

  test('should handle empty test children array', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/test.js',
        [
          {
            name: 'empty describe',
            fullName: 'empty describe',
            type: 'describe',
            file: '/workspace/test.js',
            line: 0,
            column: 0,
            children: [],
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    const rootChildren = await explorer.getChildren();
    const fileChildren = await explorer.getChildren(rootChildren[0]);
    const describeItem = fileChildren[0];
    const describeChildren = await explorer.getChildren(describeItem);

    assert.strictEqual(describeChildren.length, 0);
  });

  test('should preserve tooltip with full test name', async () => {
    const mockTests = new Map<string, JestTest[]>([
      [
        '/workspace/test.js',
        [
          {
            name: 'very long test name that might be truncated in the UI',
            fullName: 'Suite › very long test name that might be truncated in the UI',
            type: 'test',
            file: '/workspace/test.js',
            line: 0,
            column: 0,
          },
        ],
      ],
    ]);

    parserStub.getAllTests.resolves(mockTests);

    const rootChildren = await explorer.getChildren();
    const fileChildren = await explorer.getChildren(rootChildren[0]);

    assert.strictEqual(
      fileChildren[0].tooltip,
      'Suite › very long test name that might be truncated in the UI'
    );
  });
});
