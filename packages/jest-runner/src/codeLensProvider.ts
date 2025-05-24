import * as vscode from 'vscode';
import { JestTestParser, JestTest } from './parser';

export class JestCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(private parser: JestTestParser) {}

    async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
        const config = vscode.workspace.getConfiguration('jest-runner');
        if (!config.get<boolean>('showCodeLens', true)) {
            return [];
        }

        const tests = await this.parser.parseTestFile(document.fileName);
        const codeLenses: vscode.CodeLens[] = [];

        const addCodeLenses = (test: JestTest) => {
            const range = new vscode.Range(
                new vscode.Position(test.line, test.column),
                new vscode.Position(test.line, test.column + test.name.length)
            );

            // Run button
            const runLens = new vscode.CodeLens(range, {
                title: '$(play) Run',
                tooltip: `Run '${test.name}'`,
                command: 'jest-runner.runTest',
                arguments: [test.fullName, test.file]
            });
            codeLenses.push(runLens);

            // Debug button
            const debugLens = new vscode.CodeLens(range, {
                title: '$(debug-alt) Debug',
                tooltip: `Debug '${test.name}'`,
                command: 'jest-runner.debugTest',
                arguments: [test.fullName, test.file]
            });
            codeLenses.push(debugLens);

            // Add code lenses for children
            if (test.children) {
                test.children.forEach(child => addCodeLenses(child));
            }
        };

        tests.forEach(test => addCodeLenses(test));

        return codeLenses;
    }

    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }
}