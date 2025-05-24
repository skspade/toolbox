import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "{{extension-name}}" is now active!');

    // Register commands here
    // const disposable = vscode.commands.registerCommand('{{extension-name}}.helloWorld', () => {
    //     vscode.window.showInformationMessage('Hello World from {{Extension Display Name}}!');
    // });
    // context.subscriptions.push(disposable);
}

export function deactivate() {}