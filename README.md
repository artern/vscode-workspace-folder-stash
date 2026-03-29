# Workspace Folder Stash

A VS Code extension that brings Eclipse-style close/reopen functionality to multi-root workspaces. Temporarily hide root folders without removing them from your workspace.

## Features

- **Temporarily Close Folder** — Hide selected root folders in the Explorer sidebar while preserving them in your workspace configuration
- **Reopen Folder** — Restore previously closed folders from a searchable list
- **Permanent Remove** — Delete stashed folders entirely from the workspace configuration via the reopen picker
- **Multi-select Support** — Close or reopen multiple folders at once
- **Non-destructive** — All operations edit only your `.code-workspace` file; no data is lost

## Usage

### Close a Folder Temporarily

1. Right-click on a root folder in the Explorer sidebar
2. Select **"Temporarily Close Folder"**
3. The folder disappears from the Explorer but remains in your workspace file under `stashedFolders`

### Reopen a Folder

1. Right-click anywhere in the Explorer
2. Select **"Reopen Folder"**
3. Choose one or more stashed folders from the Quick Pick list
4. Press Enter to restore them to the Explorer

### Permanently Remove a Folder

1. Open the Reopen Folder picker (see above)
2. Click the trash icon (🗑️) next to any stashed folder
3. The folder is permanently deleted from the workspace configuration

## How It Works

The extension modifies your active `.code-workspace` file by:
- Moving closed folders from the `folders[]` array to a new `stashedFolders[]` array
- Restoring folders back to `folders[]` when you reopen them
- Permanently deleting folder entries when you use the trash button

All changes are saved directly to your workspace file, so you can see and edit them manually if needed.

## Requirements

- VS Code 1.74.0 or higher
- Multi-root workspace (`.code-workspace` file)

## Extension Settings

No additional settings are required. The extension works immediately after installation.

## Known Limitations

- Only works with multi-root workspaces (not single-folder mode)
- Relative paths are preserved as-is when stashing/restoring

## License

MIT

## Contributing

Bug reports and suggestions are welcome on [GitHub](https://github.com/artern/vscode-workspace-folder-stash).
