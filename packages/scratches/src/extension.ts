import * as vscode from 'vscode';
import { ScratchManager } from './scratchManager';
import { FILE_TYPES } from './types';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Scratches extension is now active!');

	const scratchManager = new ScratchManager(context);

	const createScratch = vscode.commands.registerCommand('scratches.createScratch', async () => {
		const quickPickItems = FILE_TYPES.map(fileType => ({
			label: fileType.label,
			description: fileType.extension,
			detail: fileType.description,
			fileType: fileType
		}));

		const selected = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: 'Select a file type for your scratch file',
			matchOnDescription: true,
			matchOnDetail: true
		});

		if (selected) {
			const uri = await scratchManager.createScratchFile(selected.fileType);
			if (uri) {
				vscode.window.showInformationMessage(`Created scratch file: ${path.basename(uri.fsPath)}`);
			}
		}
	});

	const listScratches = vscode.commands.registerCommand('scratches.listScratches', async () => {
		const files = await scratchManager.listScratchFiles();
		
		if (files.length === 0) {
			vscode.window.showInformationMessage('No scratch files found for this project');
			return;
		}

		const quickPickItems = files.map(file => ({
			label: path.basename(file.fsPath),
			description: new Date(path.basename(file.fsPath).split('-').slice(1, 4).join('-')).toLocaleString(),
			uri: file
		}));

		const selected = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: 'Select a scratch file to open'
		});

		if (selected) {
			const document = await vscode.workspace.openTextDocument(selected.uri);
			await vscode.window.showTextDocument(document);
		}
	});

	const deleteScratch = vscode.commands.registerCommand('scratches.deleteScratch', async () => {
		const files = await scratchManager.listScratchFiles();
		
		if (files.length === 0) {
			vscode.window.showInformationMessage('No scratch files found for this project');
			return;
		}

		const quickPickItems = files.map(file => ({
			label: path.basename(file.fsPath),
			description: new Date(path.basename(file.fsPath).split('-').slice(1, 4).join('-')).toLocaleString(),
			uri: file
		}));

		const selected = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: 'Select a scratch file to delete',
			canPickMany: true
		});

		if (selected && selected.length > 0) {
			const confirmMessage = selected.length === 1 
				? `Delete ${selected[0].label}?`
				: `Delete ${selected.length} scratch files?`;
				
			const confirm = await vscode.window.showWarningMessage(
				confirmMessage,
				{ modal: true },
				'Delete'
			);

			if (confirm === 'Delete') {
				let deletedCount = 0;
				for (const item of selected) {
					if (await scratchManager.deleteScratchFile(item.uri)) {
						deletedCount++;
					}
				}
				vscode.window.showInformationMessage(`Deleted ${deletedCount} scratch file(s)`);
			}
		}
	});

	const showScratchInfo = vscode.commands.registerCommand('scratches.showInfo', () => {
		const info = scratchManager.getProjectInfo();
		vscode.window.showInformationMessage(
			`Scratch files for "${info.name}" are stored in: ${info.path}`,
			'Open Folder'
		).then(selection => {
			if (selection === 'Open Folder') {
				vscode.env.openExternal(vscode.Uri.file(info.path));
			}
		});
	});

	context.subscriptions.push(createScratch);
	context.subscriptions.push(listScratches);
	context.subscriptions.push(deleteScratch);
	context.subscriptions.push(showScratchInfo);
}

export function deactivate() {}
