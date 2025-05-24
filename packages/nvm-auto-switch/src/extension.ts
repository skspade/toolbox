import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let currentNodeVersion: string | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('NVM Auto Switch is now active!');

    const config = vscode.workspace.getConfiguration('nvm-auto-switch');
    
    if (config.get('enable')) {
        checkAndSwitchNodeVersion();
    }

    const disposable = vscode.commands.registerCommand('nvm-auto-switch.switchVersion', async () => {
        await checkAndSwitchNodeVersion(true);
    });

    context.subscriptions.push(disposable);

    const watcher = vscode.workspace.createFileSystemWatcher('**/.nvmrc');
    
    watcher.onDidCreate(() => checkAndSwitchNodeVersion());
    watcher.onDidChange(() => checkAndSwitchNodeVersion());
    watcher.onDidDelete(() => checkAndSwitchNodeVersion());
    
    context.subscriptions.push(watcher);

    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        checkAndSwitchNodeVersion();
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
        const config = vscode.workspace.getConfiguration('nvm-auto-switch');
        if (config.get('enable')) {
            checkAndSwitchNodeVersion();
        }
    });
}

async function checkAndSwitchNodeVersion(manual: boolean = false) {
    try {
        const nvmrcPath = await findNvmrc();
        
        if (!nvmrcPath) {
            if (manual) {
                vscode.window.showInformationMessage('No .nvmrc file found in the workspace');
            }
            return;
        }

        const requiredVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
        
        if (!requiredVersion) {
            vscode.window.showWarningMessage('.nvmrc file is empty');
            return;
        }

        const { stdout: currentVersion } = await execAsync('node --version');
        const cleanCurrentVersion = currentVersion.trim();

        if (currentNodeVersion === cleanCurrentVersion && !manual) {
            return;
        }

        currentNodeVersion = cleanCurrentVersion;

        const normalizedRequired = normalizeVersion(requiredVersion);
        const normalizedCurrent = normalizeVersion(cleanCurrentVersion);

        if (normalizedRequired === normalizedCurrent && !manual) {
            return;
        }

        const config = vscode.workspace.getConfiguration('nvm-auto-switch');
        const showNotifications = config.get('showNotifications', true);

        if (showNotifications || manual) {
            const action = await vscode.window.showInformationMessage(
                `Switch Node.js version from ${cleanCurrentVersion} to ${requiredVersion}?`,
                'Yes',
                'No'
            );

            if (action !== 'Yes') {
                return;
            }
        }

        await switchNodeVersion(requiredVersion);

        if (showNotifications || manual) {
            vscode.window.showInformationMessage(`Switched to Node.js ${requiredVersion}`);
        }

    } catch (error) {
        console.error('Error in checkAndSwitchNodeVersion:', error);
        if (manual) {
            vscode.window.showErrorMessage(`Failed to switch Node.js version: ${error}`);
        }
    }
}

async function findNvmrc(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders) {
        return undefined;
    }

    for (const folder of workspaceFolders) {
        let currentPath = folder.uri.fsPath;
        
        while (currentPath !== path.dirname(currentPath)) {
            const nvmrcPath = path.join(currentPath, '.nvmrc');
            
            if (fs.existsSync(nvmrcPath)) {
                return nvmrcPath;
            }
            
            currentPath = path.dirname(currentPath);
        }
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        let currentPath = path.dirname(activeEditor.document.uri.fsPath);
        
        while (currentPath !== path.dirname(currentPath)) {
            const nvmrcPath = path.join(currentPath, '.nvmrc');
            
            if (fs.existsSync(nvmrcPath)) {
                return nvmrcPath;
            }
            
            currentPath = path.dirname(currentPath);
        }
    }

    return undefined;
}

async function switchNodeVersion(version: string) {
    const terminal = vscode.window.createTerminal({
        name: 'NVM Switch',
        env: process.env,
        shellPath: process.env.SHELL || '/bin/zsh'
    });

    const nvmCommand = `
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
nvm use ${version}
`;

    terminal.sendText(nvmCommand);
    terminal.show();

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    terminal.dispose();
}

function normalizeVersion(version: string): string {
    return version.replace(/^v/, '').trim();
}

export function deactivate() {
    currentNodeVersion = undefined;
}