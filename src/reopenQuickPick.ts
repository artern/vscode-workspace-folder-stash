import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  FolderEntry,
  getStashedFolders,
  removeStashedFoldersPermanently,
  reopenStashedFolders
} from './workspaceState';

interface StashQuickPickItem extends vscode.QuickPickItem {
  entryPath: string;
}

const REMOVE_BUTTON: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon('trash'),
  tooltip: 'Remove permanently'
};

function toQuickPickItem(entry: FolderEntry): StashQuickPickItem {
  const baseName = path.basename(entry.path);
  return {
    label: (entry.name ?? baseName) || entry.path,
    description: entry.path,
    buttons: [REMOVE_BUTTON],
    entryPath: entry.path
  };
}

export async function showReopenFolderQuickPick(): Promise<void> {
  const initialEntries = await getStashedFolders();
  if (!initialEntries.length) {
    await vscode.window.showInformationMessage('No stashed folders to reopen.');
    return;
  }

  const quickPick = vscode.window.createQuickPick<StashQuickPickItem>();
  quickPick.title = 'Reopen Folder';
  quickPick.placeholder = 'Select one or more folders to reopen';
  quickPick.canSelectMany = true;
  quickPick.matchOnDescription = true;

  const refresh = async (): Promise<void> => {
    const entries = await getStashedFolders();
    quickPick.items = entries.map(toQuickPickItem);

    if (!quickPick.items.length) {
      quickPick.hide();
      await vscode.window.showInformationMessage('No stashed folders to reopen.');
    }
  };

  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems.map((item) => item.entryPath);
    if (!selected.length) {
      return;
    }

    await reopenStashedFolders(selected);
    quickPick.hide();
  });

  quickPick.onDidTriggerItemButton(async (event) => {
    if (event.button !== REMOVE_BUTTON) {
      return;
    }

    await removeStashedFoldersPermanently([event.item.entryPath]);
    await refresh();
  });

  quickPick.onDidHide(() => {
    quickPick.dispose();
  });

  quickPick.items = initialEntries.map(toQuickPickItem);
  quickPick.show();
}
