# Change: Migrate Package Manager to pnpm

## Why
The project currently uses npm as the package manager (evidenced by `package-lock.json`). Migrating to pnpm offers several benefits for a TypeScript/Node.js project:
- **Disk space efficiency**: pnpm uses a content-addressable store, avoiding duplicate packages across projects
- **Faster installations**: pnpm installs dependencies in parallel and reuses cached packages
- **Stricter dependency resolution**: pnpm creates a non-flat `node_modules` structure that prevents phantom dependencies
- **Monorepo support**: Better prepared for potential future expansion into a monorepo structure
- **Better performance**: Generally faster than npm for install, update, and clean operations

## What Changes
- **Package Manager**: Replace npm with pnpm as the default package manager
- **Lock File**: Replace `package-lock.json` with `pnpm-lock.yaml`
- **CI/CD Configuration**: Update any CI/CD pipelines to use pnpm (if applicable)
- **Documentation**: Update project documentation to reflect pnpm usage
- **Developer Workflow**: Update contribution guidelines and setup instructions

## Impact
- **Affected specs**:
    - `package-manager`: New capability defining package manager requirements and conventions
- **Affected code**:
    - Root directory (removal of `package-lock.json`, addition of `pnpm-lock.yaml`)
    - `package.json` (optional: add `packageManager` field)
    - `README.md` (update setup instructions)
    - `openspec/project.md` (add pnpm to tech stack and conventions)
    - `.gitignore` (ensure pnpm-specific files are properly handled)
- **Developer Impact**:
    - Developers will need to install pnpm globally: `npm install -g pnpm`
    - Existing `node_modules` should be removed and reinstalled with pnpm
    - All npm commands (`npm install`, `npm run`, etc.) will be replaced with pnpm equivalents
- **CI/CD Impact**:
    - Any CI/CD pipelines will need to install pnpm and use it instead of npm
    - Cache keys for dependency caching will need to reference `pnpm-lock.yaml` instead of `package-lock.json`
