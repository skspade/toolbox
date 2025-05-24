import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FileTypeTemplate } from './types';

export class ScratchManager {
  private readonly globalScratchesDir: string;
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.globalScratchesDir = path.join(os.homedir(), '.vscode-scratches');
    this.ensureGlobalDirectory();
  }

  private ensureGlobalDirectory(): void {
    if (!fs.existsSync(this.globalScratchesDir)) {
      fs.mkdirSync(this.globalScratchesDir, { recursive: true });
    }
  }

  private getProjectDirectory(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return path.join(this.globalScratchesDir, 'no-workspace');
    }

    const projectName = path.basename(workspaceFolders[0].uri.fsPath);
    const projectHash = this.hashString(workspaceFolders[0].uri.fsPath);
    const projectDir = path.join(this.globalScratchesDir, `${projectName}-${projectHash}`);

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    return projectDir;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  private generateFileName(fileType: FileTypeTemplate): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `scratch-${timestamp}${fileType.extension}`;
  }

  async createScratchFile(fileType: FileTypeTemplate): Promise<vscode.Uri | undefined> {
    try {
      const projectDir = this.getProjectDirectory();
      const fileName = this.generateFileName(fileType);
      const filePath = path.join(projectDir, fileName);

      const content = fileType.template || '';
      fs.writeFileSync(filePath, content, 'utf8');

      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      if (fileType.template) {
        const lastLine = document.lineCount - 1;
        const lastChar = document.lineAt(lastLine).text.length;
        const templateLines = fileType.template.split('\n');
        let cursorLine = Math.floor(templateLines.length / 2);
        
        for (let i = 0; i < templateLines.length; i++) {
          if (templateLines[i].includes('    ') || templateLines[i].includes('\t')) {
            cursorLine = i;
            break;
          }
        }

        const position = new vscode.Position(cursorLine, templateLines[cursorLine].length);
        editor.selection = new vscode.Selection(position, position);
      }

      return uri;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create scratch file: ${error}`);
      return undefined;
    }
  }

  async listScratchFiles(): Promise<vscode.Uri[]> {
    const projectDir = this.getProjectDirectory();
    const files: vscode.Uri[] = [];

    try {
      const entries = fs.readdirSync(projectDir);
      for (const entry of entries) {
        if (entry.startsWith('scratch-')) {
          files.push(vscode.Uri.file(path.join(projectDir, entry)));
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to list scratch files: ${error}`);
    }

    return files;
  }

  async deleteScratchFile(uri: vscode.Uri): Promise<boolean> {
    try {
      fs.unlinkSync(uri.fsPath);
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete scratch file: ${error}`);
      return false;
    }
  }

  getProjectInfo(): { name: string; path: string } {
    const projectDir = this.getProjectDirectory();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return { name: 'No Workspace', path: projectDir };
    }

    return {
      name: path.basename(workspaceFolders[0].uri.fsPath),
      path: projectDir
    };
  }
}