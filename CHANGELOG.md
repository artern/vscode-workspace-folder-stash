# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-29

### Added
- **Temporarily Close Folder** command — hide root folders in the Explorer sidebar while preserving them in `.code-workspace`
- **Reopen Folder** command with multi-select QuickPick UI for restoring stashed folders
- **Permanent Remove** functionality via trash button in the reopen picker
- Direct editing of `.code-workspace` files to persist folder stash state
- Support for multiple folder close/reopen operations in one action
- Proper context menu integration in Explorer with stable visibility conditions

### Technical
- Built with TypeScript and esbuild for Node 20+
- Uses `jsonc-parser` for comment-aware workspace file parsing
- Implements relative/absolute path preservation for portability
