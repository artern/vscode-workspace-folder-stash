import * as vscode from 'vscode';
import { showReopenFolderQuickPick } from './reopenQuickPick';
import { closeFoldersTemporarily } from './workspaceState';

export function activate(context: vscode.ExtensionContext): void {
  const closeCommand = vscode.commands.registerCommand(
    'folderStash.temporarilyCloseFolder',
    async (resource: vscode.Uri | undefined, selectedResources: vscode.Uri[] | undefined) => {
      try {
        const rawTargets =
          selectedResources && selectedResources.length
            ? selectedResources
            : resource
              ? [resource]
              : [];

        const targets = rawTargets.filter((uri) => {
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
          return workspaceFolder?.uri.fsPath === uri.fsPath;
        });

        if (!targets.length) {
          return;
        }

        await closeFoldersTemporarily(targets);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await vscode.window.showErrorMessage(message);
      }
    }
  );

  const reopenCommand = vscode.commands.registerCommand('folderStash.reopenFolder', async () => {
    try {
      await showReopenFolderQuickPick();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await vscode.window.showErrorMessage(message);
    }
  });

  context.subscriptions.push(closeCommand, reopenCommand);
}

export function deactivate(): void {
  // No-op
}
