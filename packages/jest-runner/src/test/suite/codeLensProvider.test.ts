import assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { JestCodeLensProvider } from '../../codeLensProvider';
import { JestTestParser, JestTest } from '../../parser';

suite('JestCodeLensProvider Test Suite', () => {
    let provider: JestCodeLensProvider;
    let parserStub: sinon.SinonStubbedInstance<JestTestParser>;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
        parserStub = sandbox.createStubInstance(JestTestParser);
        provider = new JestCodeLensProvider(parserStub as any);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should provide code lenses for tests', async () => {
        const mockTests: JestTest[] = [
            {
                name: 'test 1',
                fullName: 'test 1',
                type: 'test',
                file: '/test.js',
                line: 5,
                column: 0
            },
            {
                name: 'describe block',
                fullName: 'describe block',
                type: 'describe',
                file: '/test.js',
                line: 10,
                column: 0,
                children: [
                    {
                        name: 'nested test',
                        fullName: 'describe block › nested test',
                        type: 'test',
                        file: '/test.js',
                        line: 11,
                        column: 4
                    }
                ]
            }
        ];

        parserStub.parseTestFile.resolves(mockTests);

        const document = {
            fileName: '/test.js',
            getText: () => 'test content'
        } as any;

        const codeLenses = await provider.provideCodeLenses(document, {} as any);

        // Should have 2 lenses per test/describe (run + debug)
        assert.strictEqual(codeLenses.length, 6); // 3 items * 2 lenses each

        // Check first test lenses
        const test1RunLens = codeLenses[0];
        assert.strictEqual(test1RunLens.command?.command, 'jest-runner.runTest');
        assert.strictEqual(test1RunLens.command?.title, '$(play) Run');
        assert.deepStrictEqual(test1RunLens.command?.arguments, ['test 1', '/test.js']);

        const test1DebugLens = codeLenses[1];
        assert.strictEqual(test1DebugLens.command?.command, 'jest-runner.debugTest');
        assert.strictEqual(test1DebugLens.command?.title, '$(debug-alt) Debug');

        // Verify range positions
        assert.strictEqual(test1RunLens.range.start.line, 5);
        assert.strictEqual(test1RunLens.range.start.character, 0);
    });

    test('should not provide code lenses when disabled in config', async () => {
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string) => key === 'showCodeLens' ? false : undefined
        } as any);

        const document = {
            fileName: '/test.js',
            getText: () => 'test content'
        } as any;

        const codeLenses = await provider.provideCodeLenses(document, {} as any);

        assert.strictEqual(codeLenses.length, 0);
    });

    test('should handle nested tests correctly', async () => {
        const mockTests: JestTest[] = [
            {
                name: 'outer describe',
                fullName: 'outer describe',
                type: 'describe',
                file: '/test.js',
                line: 0,
                column: 0,
                children: [
                    {
                        name: 'inner describe',
                        fullName: 'outer describe › inner describe',
                        type: 'describe',
                        file: '/test.js',
                        line: 1,
                        column: 4,
                        children: [
                            {
                                name: 'deeply nested test',
                                fullName: 'outer describe › inner describe › deeply nested test',
                                type: 'test',
                                file: '/test.js',
                                line: 2,
                                column: 8
                            }
                        ]
                    }
                ]
            }
        ];

        parserStub.parseTestFile.resolves(mockTests);

        const document = {
            fileName: '/test.js',
            getText: () => 'test content'
        } as any;

        const codeLenses = await provider.provideCodeLenses(document, {} as any);

        // Should have lenses for all 3 items
        assert.strictEqual(codeLenses.length, 6);

        // Check deeply nested test
        const deepTestLenses = codeLenses.filter(lens => 
            lens.command?.arguments?.[0] === 'outer describe › inner describe › deeply nested test'
        );
        assert.strictEqual(deepTestLenses.length, 2);
    });

    test('should refresh code lenses', () => {
        let eventFired = false;
        provider.onDidChangeCodeLenses(() => {
            eventFired = true;
        });

        provider.refresh();

        assert.strictEqual(eventFired, true);
    });

    test('should handle empty test file', async () => {
        parserStub.parseTestFile.resolves([]);

        const document = {
            fileName: '/empty.test.js',
            getText: () => ''
        } as any;

        const codeLenses = await provider.provideCodeLenses(document, {} as any);

        assert.strictEqual(codeLenses.length, 0);
    });

    test('should set correct tooltip text', async () => {
        const mockTests: JestTest[] = [
            {
                name: 'my test',
                fullName: 'my test',
                type: 'test',
                file: '/test.js',
                line: 0,
                column: 0
            }
        ];

        parserStub.parseTestFile.resolves(mockTests);

        const document = {
            fileName: '/test.js',
            getText: () => 'test content'
        } as any;

        const codeLenses = await provider.provideCodeLenses(document, {} as any);

        assert.strictEqual(codeLenses[0].command?.tooltip, "Run 'my test'");
        assert.strictEqual(codeLenses[1].command?.tooltip, "Debug 'my test'");
    });
});