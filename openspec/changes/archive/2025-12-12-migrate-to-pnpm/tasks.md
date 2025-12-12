## 1. Preparation
- [x] 1.1 Verify current npm version and installed packages work correctly.
- [x] 1.2 Ensure all developers are aware of the migration and have pnpm available or can install it.
- [x] 1.3 Create backup of `package-lock.json` for rollback if needed.

## 2. Package Manager Migration
- [x] 2.1 Install pnpm globally on development machine (`npm install -g pnpm`).
- [x] 2.2 Remove existing `node_modules` directory and `package-lock.json`.
- [x] 2.3 Run `pnpm install` to generate `pnpm-lock.yaml` and install dependencies.
- [x] 2.4 Verify all dependencies installed correctly by running build and tests.

## 3. Configuration Updates
- [x] 3.1 Add `packageManager` field to `package.json` to enforce pnpm version.
- [x] 3.2 Update `.gitignore` to ensure proper handling of pnpm files (ignore `node_modules`, track `pnpm-lock.yaml`).
- [x] 3.3 Create `.npmrc` file with pnpm-specific settings if needed (e.g., `shamefully-hoist=false`).

## 4. Documentation Updates
- [x] 4.1 Update `README.md` with pnpm installation instructions and setup steps.
- [x] 4.2 Update `openspec/project.md` to include pnpm in Tech Stack section.
- [x] 4.3 Update `openspec/project.md` to add pnpm conventions to Project Conventions section.
- [x] 4.4 Document common pnpm commands (install, add, remove, run) for developer reference.

## 5. Validation
- [x] 5.1 Run `pnpm build` to verify TypeScript compilation works.
- [x] 5.2 Run `pnpm test` to verify all tests pass.
- [x] 5.3 Run all scripts defined in `package.json` (`dev`, `check-rates`, `arbitrage`) to verify functionality.
- [x] 5.4 Verify no phantom dependency issues by checking imports are from declared dependencies.

## 6. CI/CD Updates (if applicable)
- [x] 6.1 Update CI/CD workflow files to install pnpm before running commands.
- [x] 6.2 Update dependency cache configuration to use `pnpm-lock.yaml` instead of `package-lock.json`.
- [x] 6.3 Test CI/CD pipeline to ensure builds and tests pass with pnpm.
