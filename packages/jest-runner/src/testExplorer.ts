import * as vscode from 'vscode';
import * as path from 'path';
import { JestTestParser, JestTest } from './parser';
import { JestTestRunner } from './testRunner';

export class JestTestExplorer implements vscode.TreeDataProvider<TestItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TestItem | undefined | null | void> = new vscode.EventEmitter<TestItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TestItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private testItems: TestItem[] = [];

    constructor(
        private parser: JestTestParser,
        private runner: JestTestRunner
    ) {}

    refresh(): void {
        this.parser.clearCache();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TestItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TestItem): Promise<TestItem[]> {
        if (!element) {
            // Root level - get all test files
            this.testItems = [];
            const allTests = await this.parser.getAllTests();
            
            for (const [file, tests] of allTests) {
                const fileName = path.basename(file);
                const fileItem = new TestItem(
                    fileName,
                    file,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'file',
                    file
                );
                fileItem.contextValue = 'testFile';
                fileItem.iconPath = new vscode.ThemeIcon('file-code');
                this.testItems.push(fileItem);
                
                // Add tests as children
                fileItem.children = tests.map(test => this.createTestItem(test, file));
            }
            
            return this.testItems;
        } else {
            return element.children || [];
        }
    }

    private createTestItem(test: JestTest, filePath: string): TestItem {
        const hasChildren = test.children && test.children.length > 0;
        const item = new TestItem(
            test.name,
            test.fullName,
            hasChildren ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
            test.type,
            filePath,
            test.line
        );

        // Set icon based on test type
        if (test.type === 'describe') {
            item.iconPath = new vscode.ThemeIcon('symbol-class');
            item.contextValue = 'testSuite';
        } else {
            item.iconPath = new vscode.ThemeIcon('beaker');
            item.contextValue = 'test';
        }

        // Add run/debug commands
        item.command = {
            command: 'jest-runner.runTest',
            title: 'Run Test',
            arguments: [test.fullName, filePath]
        };

        // Add children if any
        if (test.children) {
            item.children = test.children.map(child => this.createTestItem(child, filePath));
        }

        return item;
    }
}

class TestItem extends vscode.TreeItem {
    children?: TestItem[];

    constructor(
        public readonly label: string,
        public readonly fullName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly testType: 'file' | 'describe' | 'test' | 'it',
        public readonly filePath: string,
        public readonly line?: number
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.fullName;
        
        // Add location info for navigation
        if (this.line !== undefined) {
            this.resourceUri = vscode.Uri.file(filePath);
            this.command = {
                command: 'vscode.open',
                title: 'Open',
                arguments: [
                    this.resourceUri,
                    {
                        selection: new vscode.Range(
                            new vscode.Position(this.line, 0),
                            new vscode.Position(this.line, 0)
                        )
                    }
                ]
            };
        }
    }
}