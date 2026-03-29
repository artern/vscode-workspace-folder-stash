import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { ParseError, parse, printParseErrorCode } from 'jsonc-parser/lib/esm/main';

export interface FolderEntry {
  path: string;
  name?: string;
}

interface WorkspaceFileData {
  folders?: FolderEntry[];
  stashedFolders?: FolderEntry[];
  [key: string]: unknown;
}

interface WorkspaceContext {
  workspaceFilePath: string;
  workspaceDir: string;
  data: WorkspaceFileData;
}

function normalizeFsPath(value: string): string {
  return path.normalize(value).toLowerCase();
}

function resolveEntryPath(entryPath: string, workspaceDir: string): string {
  if (path.isAbsolute(entryPath)) {
    return entryPath;
  }

  return path.resolve(workspaceDir, entryPath);
}

function parseWorkspaceContent(content: string): WorkspaceFileData {
  const parseErrors: ParseError[] = [];
  const parsed = parse(content, parseErrors);

  if (parseErrors.length > 0) {
    const details = parseErrors
      .map((error) => `${printParseErrorCode(error.error)} at ${error.offset}`)
      .join(', ');
    throw new Error(`Failed to parse workspace file: ${details}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Workspace file content must be a JSON object.');
  }

  return parsed as WorkspaceFileData;
}

async function readWorkspaceContext(): Promise<WorkspaceContext> {
  const workspaceFile = vscode.workspace.workspaceFile;
  if (!workspaceFile) {
    throw new Error('No workspace file is open. Save your workspace as a .code-workspace file first.');
  }

  const workspaceFilePath = workspaceFile.fsPath;
  const workspaceDir = path.dirname(workspaceFilePath);
  const rawContent = await fs.readFile(workspaceFilePath, 'utf8');
  const data = parseWorkspaceContent(rawContent);

  if (!Array.isArray(data.folders)) {
    data.folders = [];
  }

  if (!Array.isArray(data.stashedFolders)) {
    data.stashedFolders = [];
  }

  return { workspaceFilePath, workspaceDir, data };
}

async function writeWorkspaceContext(context: WorkspaceContext): Promise<void> {
  const content = JSON.stringify(context.data, null, 2) + '\n';
  await fs.writeFile(context.workspaceFilePath, content, 'utf8');
}

function entryInSet(entry: FolderEntry, workspaceDir: string, normalizedSet: Set<string>): boolean {
  const absolutePath = resolveEntryPath(entry.path, workspaceDir);
  return normalizedSet.has(normalizeFsPath(absolutePath));
}

function hasMatchingEntry(targetList: FolderEntry[], entry: FolderEntry, workspaceDir: string): boolean {
  const entryPath = normalizeFsPath(resolveEntryPath(entry.path, workspaceDir));
  return targetList.some((target) => {
    const targetPath = normalizeFsPath(resolveEntryPath(target.path, workspaceDir));
    return targetPath === entryPath;
  });
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export async function closeFoldersTemporarily(selectedUris: vscode.Uri[]): Promise<number> {
  if (!selectedUris.length) {
    return 0;
  }

  const context = await readWorkspaceContext();
  const selectedPathSet = new Set(
    selectedUris.map((uri) => normalizeFsPath(uri.fsPath))
  );

  const remainingFolders: FolderEntry[] = [];
  let movedCount = 0;

  for (const entry of context.data.folders ?? []) {
    if (!entryInSet(entry, context.workspaceDir, selectedPathSet)) {
      remainingFolders.push(entry);
      continue;
    }

    if (!hasMatchingEntry(context.data.stashedFolders ?? [], entry, context.workspaceDir)) {
      (context.data.stashedFolders ?? []).push(entry);
    }
    movedCount += 1;
  }

  context.data.folders = remainingFolders;

  if (movedCount > 0) {
    await writeWorkspaceContext(context);
  }

  return movedCount;
}

export async function getStashedFolders(): Promise<FolderEntry[]> {
  const context = await readWorkspaceContext();
  return [...(context.data.stashedFolders ?? [])];
}

export async function reopenStashedFolders(entryPaths: string[]): Promise<number> {
  const pathSet = new Set(uniqueNonEmpty(entryPaths));
  if (!pathSet.size) {
    return 0;
  }

  const context = await readWorkspaceContext();
  const remainingStashed: FolderEntry[] = [];
  let movedCount = 0;

  for (const entry of context.data.stashedFolders ?? []) {
    if (!pathSet.has(entry.path)) {
      remainingStashed.push(entry);
      continue;
    }

    if (!hasMatchingEntry(context.data.folders ?? [], entry, context.workspaceDir)) {
      (context.data.folders ?? []).push(entry);
    }
    movedCount += 1;
  }

  context.data.stashedFolders = remainingStashed;

  if (movedCount > 0) {
    await writeWorkspaceContext(context);
  }

  return movedCount;
}

export async function removeStashedFoldersPermanently(entryPaths: string[]): Promise<number> {
  const pathSet = new Set(uniqueNonEmpty(entryPaths));
  if (!pathSet.size) {
    return 0;
  }

  const context = await readWorkspaceContext();
  const originalLength = (context.data.stashedFolders ?? []).length;
  context.data.stashedFolders = (context.data.stashedFolders ?? []).filter(
    (entry) => !pathSet.has(entry.path)
  );

  const removedCount = originalLength - (context.data.stashedFolders ?? []).length;

  if (removedCount > 0) {
    await writeWorkspaceContext(context);
  }

  return removedCount;
}
