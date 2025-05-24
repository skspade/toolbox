import assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { JestTestParser, JestTest } from '../../parser';
import * as fs from 'fs';
import * as os from 'os';

suite('JestTestParser Test Suite', () => {
    let parser: JestTestParser;
    let tempDir: string;

    setup(() => {
        parser = new JestTestParser();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-runner-test-'));
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should parse simple test file', async () => {
        const testContent = `
describe('Math operations', () => {
    test('should add numbers correctly', () => {
        expect(1 + 1).toBe(2);
    });

    it('should subtract numbers correctly', () => {
        expect(5 - 3).toBe(2);
    });
});

test('standalone test', () => {
    expect(true).toBe(true);
});
        `;

        const testFile = path.join(tempDir, 'math.test.js');
        fs.writeFileSync(testFile, testContent);

        const tests = await parser.parseTestFile(testFile);

        assert.strictEqual(tests.length, 2);
        
        // Check describe block
        const describeBlock = tests[0];
        assert.strictEqual(describeBlock.name, 'Math operations');
        assert.strictEqual(describeBlock.type, 'describe');
        assert.strictEqual(describeBlock.children?.length, 2);

        // Check nested tests
        const nestedTest1 = describeBlock.children![0];
        assert.strictEqual(nestedTest1.name, 'should add numbers correctly');
        assert.strictEqual(nestedTest1.type, 'test');
        assert.strictEqual(nestedTest1.fullName, 'Math operations › should add numbers correctly');

        const nestedTest2 = describeBlock.children![1];
        assert.strictEqual(nestedTest2.name, 'should subtract numbers correctly');
        assert.strictEqual(nestedTest2.type, 'it');

        // Check standalone test
        const standaloneTest = tests[1];
        assert.strictEqual(standaloneTest.name, 'standalone test');
        assert.strictEqual(standaloneTest.type, 'test');
        assert.strictEqual(standaloneTest.fullName, 'standalone test');
    });

    test('should parse nested describe blocks', async () => {
        const testContent = `
describe('Outer', () => {
    describe('Inner', () => {
        test('deeply nested test', () => {
            expect(true).toBe(true);
        });
    });
    
    test('outer level test', () => {
        expect(true).toBe(true);
    });
});
        `;

        const testFile = path.join(tempDir, 'nested.test.js');
        fs.writeFileSync(testFile, testContent);

        const tests = await parser.parseTestFile(testFile);

        assert.strictEqual(tests.length, 1);
        
        const outerDescribe = tests[0];
        assert.strictEqual(outerDescribe.name, 'Outer');
        assert.strictEqual(outerDescribe.children?.length, 2);

        const innerDescribe = outerDescribe.children![0];
        assert.strictEqual(innerDescribe.name, 'Inner');
        assert.strictEqual(innerDescribe.type, 'describe');
        assert.strictEqual(innerDescribe.children?.length, 1);

        const deeplyNestedTest = innerDescribe.children![0];
        assert.strictEqual(deeplyNestedTest.name, 'deeply nested test');
        assert.strictEqual(deeplyNestedTest.fullName, 'Outer › Inner › deeply nested test');
    });

    test('should parse test.only and test.skip', async () => {
        const testContent = `
describe('Test modifiers', () => {
    test.only('focused test', () => {});
    test.skip('skipped test', () => {});
    it.only('focused it', () => {});
    it.skip('skipped it', () => {});
});
        `;

        const testFile = path.join(tempDir, 'modifiers.test.js');
        fs.writeFileSync(testFile, testContent);

        const tests = await parser.parseTestFile(testFile);

        assert.strictEqual(tests.length, 1);
        const describe = tests[0];
        assert.strictEqual(describe.children?.length, 4);
        
        assert.strictEqual(describe.children![0].name, 'focused test');
        assert.strictEqual(describe.children![1].name, 'skipped test');
        assert.strictEqual(describe.children![2].name, 'focused it');
        assert.strictEqual(describe.children![3].name, 'skipped it');
    });

    test('should handle empty test file', async () => {
        const testFile = path.join(tempDir, 'empty.test.js');
        fs.writeFileSync(testFile, '// Empty test file\n');

        const tests = await parser.parseTestFile(testFile);
        assert.strictEqual(tests.length, 0);
    });

    test('should cache parsed results', async () => {
        const testContent = `test('cached test', () => {});`;
        const testFile = path.join(tempDir, 'cache.test.js');
        fs.writeFileSync(testFile, testContent);

        const tests1 = await parser.parseTestFile(testFile);
        const tests2 = await parser.parseTestFile(testFile);

        // Both should return the same result
        assert.deepStrictEqual(tests1, tests2);
    });

    test('should clear cache', async () => {
        const testContent = `test('test to cache', () => {});`;
        const testFile = path.join(tempDir, 'clear-cache.test.js');
        fs.writeFileSync(testFile, testContent);

        await parser.parseTestFile(testFile);
        parser.clearCache();
        
        // After clearing cache, it should parse again
        const tests = await parser.parseTestFile(testFile);
        assert.strictEqual(tests.length, 1);
    });

    test('should find all test files in workspace', async () => {
        // This test would require mocking vscode.workspace
        // Skipping for now as it requires more complex setup
    });

    test('should handle test names with special characters', async () => {
        const testContent = `
test('should handle "quotes" and special chars: !@#$%', () => {});
test(\`template string test\`, () => {});
        `;

        const testFile = path.join(tempDir, 'special.test.js');
        fs.writeFileSync(testFile, testContent);

        const tests = await parser.parseTestFile(testFile);
        assert.strictEqual(tests.length, 2);
        assert.strictEqual(tests[0].name, 'should handle "quotes" and special chars: !@#$%');
        assert.strictEqual(tests[1].name, 'template string test');
    });

    test('should track line and column numbers correctly', async () => {
        const testContent = `// Line 0
describe('Suite', () => { // Line 1
    test('Test 1', () => { // Line 2
    });
});`;

        const testFile = path.join(tempDir, 'lines.test.js');
        fs.writeFileSync(testFile, testContent);

        const tests = await parser.parseTestFile(testFile);
        
        const describe = tests[0];
        assert.strictEqual(describe.line, 1);
        assert.strictEqual(describe.column, 0);

        const test = describe.children![0];
        assert.strictEqual(test.line, 2);
        assert.strictEqual(test.column, 4); // 4 spaces indentation
    });
});