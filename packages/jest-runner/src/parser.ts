import * as vscode from 'vscode';
import * as path from 'path';

export interface JestTest {
    name: string;
    fullName: string;
    type: 'describe' | 'test' | 'it';
    file: string;
    line: number;
    column: number;
    children?: JestTest[];
}

export class JestTestParser {
    private testCache = new Map<string, JestTest[]>();

    async parseTestFile(filePath: string): Promise<JestTest[]> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const content = document.getText();
            const tests = this.parseContent(content, filePath);
            this.testCache.set(filePath, tests);
            return tests;
        } catch (error) {
            console.error(`Error parsing test file ${filePath}:`, error);
            return [];
        }
    }

    private parseContent(content: string, filePath: string): JestTest[] {
        const tests: JestTest[] = [];
        const lines = content.split('\n');
        
        // Stack to track nested describe blocks
        const describeStack: JestTest[] = [];
        
        // Regex patterns for test detection
        const describePattern = /^\s*(describe|describe\.only|describe\.skip)\s*\(\s*['"`]([^'"`]+)['"`]/;
        const testPattern = /^\s*(test|it|test\.only|it\.only|test\.skip|it\.skip)\s*\(\s*['"`]([^'"`]+)['"`]/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for describe blocks
            const describeMatch = line.match(describePattern);
            if (describeMatch) {
                const [, keyword, name] = describeMatch;
                const column = line.indexOf(keyword);
                
                const describeBlock: JestTest = {
                    name,
                    fullName: this.buildFullName(describeStack, name),
                    type: 'describe',
                    file: filePath,
                    line: i,
                    column,
                    children: []
                };

                if (describeStack.length > 0) {
                    const parent = describeStack[describeStack.length - 1];
                    parent.children!.push(describeBlock);
                } else {
                    tests.push(describeBlock);
                }

                describeStack.push(describeBlock);
                continue;
            }

            // Check for test cases
            const testMatch = line.match(testPattern);
            if (testMatch) {
                const [, keyword, name] = testMatch;
                const column = line.indexOf(keyword);
                
                const test: JestTest = {
                    name,
                    fullName: this.buildFullName(describeStack, name),
                    type: keyword.startsWith('test') ? 'test' : 'it',
                    file: filePath,
                    line: i,
                    column
                };

                if (describeStack.length > 0) {
                    const parent = describeStack[describeStack.length - 1];
                    parent.children!.push(test);
                } else {
                    tests.push(test);
                }
            }

            // Check for closing braces to pop describe stack
            if (line.includes('}')) {
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;
                const netBraces = closeBraces - openBraces;
                
                for (let j = 0; j < netBraces && describeStack.length > 0; j++) {
                    // Simple heuristic: check if we should pop the stack
                    const currentIndent = line.search(/\S/);
                    if (currentIndent !== -1 && describeStack.length > 0) {
                        const parentTest = describeStack[describeStack.length - 1];
                        const parentLine = lines[parentTest.line];
                        const parentIndent = parentLine.search(/\S/);
                        
                        if (currentIndent <= parentIndent) {
                            describeStack.pop();
                        }
                    }
                }
            }
        }

        return tests;
    }

    private buildFullName(stack: JestTest[], name: string): string {
        const names = stack.map(t => t.name);
        names.push(name);
        return names.join(' › ');
    }

    async findAllTestFiles(): Promise<string[]> {
        const testFiles: string[] = [];
        
        if (!vscode.workspace.workspaceFolders) {
            return testFiles;
        }

        const files = await vscode.workspace.findFiles(
            '**/*.{test,spec}.{js,jsx,ts,tsx}',
            '**/node_modules/**'
        );
        
        return files.map(f => f.fsPath);
    }

    async getAllTests(): Promise<Map<string, JestTest[]>> {
        const allTests = new Map<string, JestTest[]>();
        const testFiles = await this.findAllTestFiles();
        
        for (const file of testFiles) {
            const tests = await this.parseTestFile(file);
            if (tests.length > 0) {
                allTests.set(file, tests);
            }
        }
        
        return allTests;
    }

    clearCache() {
        this.testCache.clear();
    }
}