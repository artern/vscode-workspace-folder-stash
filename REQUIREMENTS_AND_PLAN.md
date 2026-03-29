# 项目需求与实现计划

## 原始诉求（2026-03-29）

用户希望开发一个 VS Code 插件，在多根工作区环境下对 Explorer 区域中的 root folder 实现类似于 Eclipse 中的 close/open project 功能。

### 核心需求

1. 在 Explorer 右键菜单中增加两个菜单项：
   - "Temporarily Close Folder"（临时关闭文件夹）
   - "Reopen Folder"（重新打开文件夹）

2. 关闭逻辑：
   - 选中一个或多个 root folder 右键点击"Temporarily Close Folder"
   - 该文件夹从 Explorer 中临时消失
   - 通过编辑 `.code-workspace` 文件实现：将文件夹从 `folders[]` 移至 `stashedFolders[]`

3. 重新打开逻辑：
   - 点击"Reopen Folder"弹出 QuickPick 界面
   - 支持多选已关闭的文件夹
   - 确认后将文件夹从 `stashedFolders[]` 恢复至 `folders[]`
   - 在 QuickPick 中每项旁有垃圾桶按钮，用于永久移除文件夹

### 非功能需求

1. 命名规范
   - 扩展包名：vscode-workspace-folder-stash
   - 工作区 JSON 字段：stashedFolders
   - 菜单文案：Temporarily Close Folder / Reopen Folder

2. 开发环境
   - Node 版本管理：nvm use 20
   - 包管理器：pnpm
   - npm 镜像源：https://registry.npmmirror.com（.npmrc 配置）

3. 构建工具
   - esbuild 用于打包
   - TypeScript 编译

---

## 完整实现计划

### Phase 1 - 项目初始化（完成）
- ✅ 创建 package.json（含 contributes 配置、scripts）
- ✅ 创建 tsconfig.json（TS 编译配置）
- ✅ 创建 esbuild.js（打包配置，mainFields 优化）
- ✅ 创建 .npmrc（npmmirror 镜像源）
- ✅ 创建 .gitignore 和 .vscodeignore
- ✅ 使用 pnpm 安装依赖

### Phase 2 - 核心工作区状态管理（完成）
**文件：src/workspaceState.ts**

核心接口：
```typescript
interface FolderEntry {
  path: string;
  name?: string;
}

interface WorkspaceFileData {
  folders?: FolderEntry[];
  stashedFolders?: FolderEntry[];
  [key: string]: unknown;
}
```

关键函数：
- `getWorkspaceFilePath()` → 获取活跃 workspace 文件路径
- `readWorkspaceContext()` → 读取和解析 `.code-workspace` 文件（使用 jsonc-parser 解析，兼容注释）
- `writeWorkspaceContext(context)` → 写回工作区文件（JSON.stringify）
- `resolveFolderPath(entryPath, wsDir)` → 解析相对/绝对路径
- `closeFoldersTemporarily(uris)` → 移动文件夹到 stashedFolders
- `reopenStashedFolders(entryPaths)` → 恢复文件夹
- `removeStashedFoldersPermanently(entryPaths)` → 永久删除

关键设计：
- 路径规范化以精确匹配 URI 和文件系统路径
- 避免重复条目（检查目标数组中是否已存在）
- 保留原始路径格式（相对/绝对）用于可移植性

### Phase 3 - Reopen QuickPick UI（完成）
**文件：src/reopenQuickPick.ts**

功能：
- `showReopenFolderQuickPick()` → 显示多选 QuickPick
- 每项旁配备垃圾桶按钮（Codicon.trash）
- 支持多选 + Enter 确认批量恢复
- 点击垃圾桶按钮触发 `onDidTriggerItemButton` 回调，立即永久删除并刷新列表
- 若无暂存文件夹则显示提示信息

### Phase 4 - 命令注册与菜单配置（完成）
**文件：src/extension.ts**

命令注册：
- `folderStash.temporarilyCloseFolder` → 调用 closeFoldersTemporarily
- `folderStash.reopenFolder` → 调用 showReopenFolderQuickPick

命令处理：
- 支持单选和多选场景（Explorer 右键传入 selectedUris）
- 过滤有效的 workspace root（通过 getWorkspaceFolder 验证）
- 执行失败时显示错误提示

**菜单配置（package.json）**
```json
"menus": {
  "explorer/context": [
    {
      "command": "folderStash.temporarilyCloseFolder",
      "when": "resourceSet && explorerResourceIsRoot && listHasSelectionOrFocus && workspaceFolderCount > 0 && workbenchState == workspace",
      "group": "9_folderStash@1"
    },
    {
      "command": "folderStash.reopenFolder",
      "when": "workbenchState == workspace",
      "group": "9_folderStash@2"
    }
  ]
}
```

When 条件详解：
- `resourceSet` — 确保有资源被选中
- `explorerResourceIsRoot` — 仅在 root folder 显示 close 命令
- `listHasSelectionOrFocus` — 额外保障 Explorer 列表有活跃选中
- `workspaceFolderCount > 0` — 工作区非空
- `workbenchState == workspace` — 多根工作区模式

### Phase 5 - 打包与错误修复（完成）

关键修复：
1. **jsonc-parser UMD 入口问题** → 配置 esbuild mainFields 优先读取 ESM 版本
   ```javascript
   mainFields: ['module', 'main']
   ```

2. **菜单可见性调优** → 通过 when 条件多层过滤，避免空白处误触

3. **命令执行防护** → 在命令处理器中验证选中项是否为有效 root folder

### Phase 6 - 发布准备（完成）

文档与配置：
- ✅ README.md（英文功能说明）
- ✅ README.zh-CN.md（中文功能说明）
- ✅ CHANGELOG.md（版本记录）
- ✅ LICENSE（MIT）
- ✅ package.json（完整元数据 + publisher/author/keywords/repository）

版本与发布：
- 版本号：0.1.0
- Publisher：artern
- GitHub：https://github.com/artern/vscode-workspace-folder-stash
- 发布流程：`pnpx @vscode/vsce publish --no-dependencies`
- 版本递增建议：发布前使用 `pnpm version`（如 `pnpm version patch`）提升版本，避免重复版本发布失败

---

## 关键设计决策

### 1. 为什么使用 stashedFolders 而非 temporarilyClosedFolders？
- 更简洁，符合常见的 "stash" 概念（如 git stash）
- 用户界面中仍用 "Temporarily Close" 保持清晰

### 2. 为什么直接编辑 .code-workspace 文件？
- VS Code 会自动监听文件变化并刷新 Explorer
- 无需借助 VS Code API 修改工作区（该 API 通常仅在启动时调用）
- 用户可手动编辑和版本管理工作区配置

### 3. 为什么用 jsonc-parser？
- 工作区文件可能含注释，需要容错解析
- 标准 JSON.parse 会报错
- JSON.stringify 用于写回时自动格式化

### 4. 为什么保留原始路径格式？
- 相对路径便于跨设备或容器移植
- 绝对路径已由用户指定，尊重其选择
- 避免不必要的路径转换出错

### 5. 为什么限制 close 命令只在 root folder 显示？
- 避免子目录误触
- 符合 Eclipse 的 "close project" 语义
- 通过 `explorerResourceIsRoot` + `listHasSelectionOrFocus` 双重保障

---

## 环境与工具链

### Node 与包管理
- Node 版本：20.x（通过 nvm）
- 包管理器：pnpm
- npm 源：https://registry.npmmirror.com

### 构建与开发
- 编译：TypeScript 5.6+
- 打包：esbuild 0.24+ 
- 监听模式：`pnpm run watch`
- 调试：VS Code Extension Development Host（F5）

### 依赖
- Runtime: jsonc-parser 3.3+
- DevDeps: @types/vscode 1.74+, @types/node 20+, typescript 5.6+, esbuild 0.24+

---

## 测试与验证清单

### 功能测试
- [ ] 打开多根 `.code-workspace` 文件
- [ ] 右键根目录 → "Temporarily Close Folder" 可见
- [ ] 点击后文件夹从 Explorer 消失，`.code-workspace` 生成 `stashedFolders` 节点
- [ ] 右键任意位置 → "Reopen Folder" 弹出 QuickPick，列出暂存文件夹
- [ ] 选中并 Enter → 文件夹恢复到 Explorer
- [ ] 点击垃圾桶按钮 → 文件夹从列表和 `.code-workspace` 中永久移除
- [ ] 多选多个文件夹后 Enter → 批量恢复

### 边界情况
- [ ] 无 workspace 文件时报错提示
- [ ] 单文件夹模式下 close/reopen 菜单不出现
- [ ] 未选中任何文件夹时菜单不出现
- [ ] 重复关闭同一文件夹 → 无重复条目
- [ ] 相对路径和绝对路径混合时正确处理

### 发布准备
- [ ] `pnpm run build` 成功，无编译错误
- [ ] `out/extension.js` 体积合理（< 200KB）
- [ ] GitHub 仓库已创建并提交
- [ ] VS Code Marketplace Publisher 已注册
- [ ] `vsce publish` 执行成功

---

## 后续改进方向

1. **单元测试** — 补充 workspaceState.ts 的核心逻辑测试
2. **集成测试** — 编写 E2E 测试验证 Explorer 菜单行为
3. **插件图标** — 设计 128x128 或 256x256 PNG 图标
4. **性能优化** — 对超大工作区（100+ 文件夹）进行性能测试
5. **国际化** — 支持更多语言（日文、韩文等）
6. **快捷键绑定** — 提供可配置的快捷键访问

---

## 版本历史

### v0.1.0 - 2026-03-29（首个公开发布版）
- ✅ 核心功能完成
- ✅ 文档齐全
- ✅ 发布到 VS Code Marketplace
