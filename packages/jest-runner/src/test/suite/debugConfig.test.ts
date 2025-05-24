import assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { JestDebugConfigurationProvider } from '../../debugConfig';

suite('JestDebugConfigurationProvider Test Suite', () => {
    let provider: JestDebugConfigurationProvider;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
        provider = new JestDebugConfigurationProvider();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should provide default debug configurations', () => {
        const configs = provider.provideDebugConfigurations(undefined);
        
        assert(Array.isArray(configs));
        assert.strictEqual(configs!.length, 2);

        // Check first config (current file)
        const currentFileConfig = configs![0];
        assert.strictEqual(currentFileConfig.type, 'node');
        assert.strictEqual(currentFileConfig.request, 'launch');
        assert.strictEqual(currentFileConfig.name, 'Debug Jest Current File');
        assert(currentFileConfig.args.includes('${file}'));
        assert(currentFileConfig.args.includes('--runInBand'));
        assert(currentFileConfig.args.includes('--no-cache'));
        assert(currentFileConfig.args.includes('--no-coverage'));
        assert.strictEqual(currentFileConfig.console, 'integratedTerminal');
        assert.strictEqual(currentFileConfig.sourceMaps, true);

        // Check second config (all tests)
        const allTestsConfig = configs![1];
        assert.strictEqual(allTestsConfig.name, 'Debug Jest All Tests');
        assert(!allTestsConfig.args.includes('${file}'));
    });

    test('should resolve empty configuration for test file', () => {
        const mockEditor = {
            document: {
                fileName: '/workspace/test.spec.js'
            }
        };
        sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

        const emptyConfig: vscode.DebugConfiguration = {
            type: '',
            request: '',
            name: ''
        };

        const resolved = provider.resolveDebugConfiguration(undefined, emptyConfig);

        assert.strictEqual(resolved!.type, 'node');
        assert.strictEqual(resolved!.request, 'launch');
        assert.strictEqual(resolved!.name, 'Debug Jest Tests');
        assert(resolved!.args.includes('${file}'));
        assert(resolved!.args.includes('--runInBand'));
        assert.strictEqual(resolved!.env.NODE_ENV, 'test');
    });

    test('should not resolve empty configuration for non-test file', () => {
        const mockEditor = {
            document: {
                fileName: '/workspace/index.js'
            }
        };
        sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

        const emptyConfig: vscode.DebugConfiguration = {
            type: '',
            request: '',
            name: ''
        };

        const resolved = provider.resolveDebugConfiguration(undefined, emptyConfig);

        // Should return the same empty config
        assert.strictEqual(resolved!.type, '');
        assert.strictEqual(resolved!.request, '');
        assert.strictEqual(resolved!.name, '');
    });

    test('should enhance existing Jest debug configuration', () => {
        const config: vscode.DebugConfiguration = {
            type: 'node',
            request: 'launch',
            name: 'My Jest Debug',
            program: 'jest',
            args: ['test.js']
        };

        const resolved = provider.resolveDebugConfiguration(undefined, config);

        // Should add --runInBand if not present
        assert(resolved!.args.includes('--runInBand'));
        assert.strictEqual(resolved!.sourceMaps, true);
        assert.strictEqual(resolved!.console, 'integratedTerminal');
        assert(Array.isArray(resolved!.resolveSourceMapLocations));
    });

    test('should not duplicate --runInBand flag', () => {
        const config: vscode.DebugConfiguration = {
            type: 'node',
            request: 'launch',
            name: 'My Jest Debug',
            program: 'jest',
            args: ['test.js', '--runInBand']
        };

        const resolved = provider.resolveDebugConfiguration(undefined, config);

        // Should not add duplicate --runInBand
        const runInBandCount = resolved!.args.filter((arg: string) => arg === '--runInBand').length;
        assert.strictEqual(runInBandCount, 1);
    });

    test('should preserve existing configuration values', () => {
        const config: vscode.DebugConfiguration = {
            type: 'node',
            request: 'launch',
            name: 'My Jest Debug',
            program: 'jest',
            args: ['test.js'],
            sourceMaps: false,
            console: 'externalTerminal',
            resolveSourceMapLocations: ['custom/**']
        };

        const resolved = provider.resolveDebugConfiguration(undefined, config);

        // Should preserve user's values
        assert.strictEqual(resolved!.sourceMaps, false);
        assert.strictEqual(resolved!.console, 'externalTerminal');
        assert.deepStrictEqual(resolved!.resolveSourceMapLocations, ['custom/**']);
    });

    test('should only enhance node type Jest configurations', () => {
        const config: vscode.DebugConfiguration = {
            type: 'python',
            request: 'launch',
            name: 'My Python Debug',
            program: 'test.py'
        };

        const resolved = provider.resolveDebugConfiguration(undefined, config);

        // Should not modify non-node configurations
        assert.strictEqual(resolved, config);
        assert(!resolved.args);
        assert(!resolved.sourceMaps);
    });

    test('should handle configuration without args array', () => {
        const config: vscode.DebugConfiguration = {
            type: 'node',
            request: 'launch',
            name: 'Jest Debug without args',
            program: 'jest'
        };

        const resolved = provider.resolveDebugConfiguration(undefined, config);

        // Should not add args if config is not for Jest
        assert.strictEqual(resolved, config);
    });

    test('should identify test files correctly', () => {
        const testFiles = [
            'test.spec.js',
            'test.test.js',
            'something.spec.ts',
            'another.test.tsx',
            'folder/deep/file.spec.jsx'
        ];

        const nonTestFiles = [
            'index.js',
            'testutils.js',
            'spec.js',
            'test.js',
            'myspec.doc.js'
        ];

        // Access private method through type assertion
        const providerAny = provider as any;

        testFiles.forEach(file => {
            assert(providerAny.isTestFile(file), `${file} should be identified as test file`);
        });

        nonTestFiles.forEach(file => {
            assert(!providerAny.isTestFile(file), `${file} should not be identified as test file`);
        });
    });
});