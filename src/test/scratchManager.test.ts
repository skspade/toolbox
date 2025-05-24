import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ScratchManager } from '../scratchManager';
import { FILE_TYPES } from '../types';

suite('ScratchManager Test Suite', () => {
    let context: vscode.ExtensionContext;
    let scratchManager: ScratchManager;
    let testScratchDir: string;

    setup(() => {
        // Create a minimal mock context that satisfies our needs
        context = {
            subscriptions: [],
            globalStorageUri: vscode.Uri.file(path.join(os.tmpdir(), 'test-scratch-storage')),
            asAbsolutePath: (relativePath: string) => relativePath
        } as any;

        scratchManager = new ScratchManager(context);
        testScratchDir = path.join(os.homedir(), '.vscode-scratches');
    });

    teardown(() => {
        // Clean up test scratch files
        const projectInfo = scratchManager.getProjectInfo();
        if (fs.existsSync(projectInfo.path)) {
            const files = fs.readdirSync(projectInfo.path);
            files.forEach(file => {
                if (file.startsWith('scratch-')) {
                    fs.unlinkSync(path.join(projectInfo.path, file));
                }
            });
        }
    });

    test('Global scratch directory is created', () => {
        assert.strictEqual(fs.existsSync(testScratchDir), true);
    });

    test('Project directory is created', () => {
        const projectInfo = scratchManager.getProjectInfo();
        assert.strictEqual(fs.existsSync(projectInfo.path), true);
    });

    test('Create scratch file with JavaScript template', async () => {
        const jsFileType = FILE_TYPES.find(ft => ft.id === 'javascript');
        assert.ok(jsFileType);

        const uri = await scratchManager.createScratchFile(jsFileType);
        assert.ok(uri);
        assert.strictEqual(path.extname(uri.fsPath), '.js');
        assert.strictEqual(fs.existsSync(uri.fsPath), true);

        const content = fs.readFileSync(uri.fsPath, 'utf8');
        assert.strictEqual(content, jsFileType.template || '');
    });

    test('Create scratch file with Java template', async () => {
        const javaFileType = FILE_TYPES.find(ft => ft.id === 'java');
        assert.ok(javaFileType);
        assert.ok(javaFileType.template);

        const uri = await scratchManager.createScratchFile(javaFileType);
        assert.ok(uri);
        assert.strictEqual(path.extname(uri.fsPath), '.java');

        const content = fs.readFileSync(uri.fsPath, 'utf8');
        assert.strictEqual(content, javaFileType.template);
    });

    test('List scratch files', async () => {
        // Create multiple scratch files
        const jsFileType = FILE_TYPES.find(ft => ft.id === 'javascript')!;
        const pyFileType = FILE_TYPES.find(ft => ft.id === 'python')!;

        await scratchManager.createScratchFile(jsFileType);
        await scratchManager.createScratchFile(pyFileType);

        const files = await scratchManager.listScratchFiles();
        assert.strictEqual(files.length >= 2, true);
        
        const extensions = files.map(f => path.extname(f.fsPath));
        assert.strictEqual(extensions.includes('.js'), true);
        assert.strictEqual(extensions.includes('.py'), true);
    });

    test('Delete scratch file', async () => {
        const jsFileType = FILE_TYPES.find(ft => ft.id === 'javascript')!;
        const uri = await scratchManager.createScratchFile(jsFileType);
        assert.ok(uri);
        assert.strictEqual(fs.existsSync(uri.fsPath), true);

        const deleted = await scratchManager.deleteScratchFile(uri);
        assert.strictEqual(deleted, true);
        assert.strictEqual(fs.existsSync(uri.fsPath), false);
    });

    test('Scratch files are isolated by project', () => {
        const projectInfo1 = scratchManager.getProjectInfo();
        
        // Simulate different workspace
        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: [{
                uri: vscode.Uri.file('/different/project'),
                name: 'different-project',
                index: 0
            }],
            configurable: true
        });

        const scratchManager2 = new ScratchManager(context);
        const projectInfo2 = scratchManager2.getProjectInfo();

        assert.notStrictEqual(projectInfo1.path, projectInfo2.path);

        // Restore original workspace
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: originalWorkspaceFolders,
            configurable: true
        });
    });

    test('Handles no workspace gracefully', () => {
        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: undefined,
            configurable: true
        });

        const scratchManagerNoWorkspace = new ScratchManager(context);
        const projectInfo = scratchManagerNoWorkspace.getProjectInfo();
        
        assert.strictEqual(projectInfo.name, 'No Workspace');
        assert.ok(projectInfo.path.includes('no-workspace'));

        // Restore original workspace
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: originalWorkspaceFolders,
            configurable: true
        });
    });

    test('Generated filenames are unique', async () => {
        const jsFileType = FILE_TYPES.find(ft => ft.id === 'javascript')!;
        
        const uri1 = await scratchManager.createScratchFile(jsFileType);
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        const uri2 = await scratchManager.createScratchFile(jsFileType);

        assert.ok(uri1);
        assert.ok(uri2);
        assert.notStrictEqual(path.basename(uri1.fsPath), path.basename(uri2.fsPath));
    });

    test('All file types have valid extensions', () => {
        FILE_TYPES.forEach(fileType => {
            assert.ok(fileType.extension.startsWith('.'), `${fileType.label} extension should start with dot`);
            assert.ok(fileType.extension.length > 1, `${fileType.label} extension should have content after dot`);
        });
    });
});