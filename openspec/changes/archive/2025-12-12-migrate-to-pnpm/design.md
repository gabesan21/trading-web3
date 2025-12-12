## Context
The project uses npm as the package manager with a standard `package-lock.json` lock file. As the project grows and potentially adds more dependencies (DEX integrations, testing utilities, monitoring tools), the efficiency and strictness of the package manager become increasingly important.

## Goals / Non-Goals
- **Goals**:
    - Seamless migration from npm to pnpm with no functionality loss
    - Faster dependency installation and updates
    - Stricter dependency management to prevent phantom dependencies
    - Better disk space utilization across multiple projects
    - Improved developer experience with faster install times
- **Non-Goals**:
    - Migrating to Yarn or other package managers
    - Converting to a monorepo structure (though pnpm supports this for future expansion)
    - Changing any package versions during migration

## Decisions

### Decision: Use pnpm v9.x or latest stable
- **Rationale**: Latest stable version provides best performance and bug fixes
- **Implementation**: Specify in `package.json` using `packageManager` field: `"packageManager": "pnpm@9.15.0"`

### Decision: Use default pnpm `node_modules` structure (non-hoisted)
- **Rationale**: 
    - Prevents phantom dependencies (importing packages not declared in `package.json`)
    - More accurate representation of dependency graph
    - Catches potential issues early in development
- **Trade-off**: Some tools that traverse `node_modules` may not work without modification
- **Mitigation**: If issues arise with specific tools, can enable selective hoisting via `.npmrc`

### Decision: Track `pnpm-lock.yaml` in version control
- **Rationale**:
    - Ensures reproducible builds across all environments
    - Allows code review of dependency changes
    - Standard practice for lock files
- **Implementation**: Add to git, exclude from `.gitignore`

### Decision: Remove `package-lock.json` completely
- **Rationale**:
    - Avoid confusion between package managers
    - pnpm and npm lock files can conflict
    - Clean migration with single source of truth
- **Implementation**: Delete `package-lock.json` and add to `.gitignore` to prevent regeneration

### Decision: Keep `package.json` scripts unchanged
- **Rationale**:
    - pnpm is compatible with npm script syntax
    - No need to rewrite scripts during migration
    - `pnpm run` works identically to `npm run`
- **Implementation**: No changes required to existing scripts

### Decision: Optional `.npmrc` configuration file
- **Rationale**: 
    - Allows project-specific pnpm settings
    - Can configure strictness, hoisting, and other behaviors
- **Suggested initial settings**:
    ```ini
    # Enforce exact versions from lock file
    prefer-frozen-lockfile=true
    
    # Strict peer dependencies
    strict-peer-dependencies=true
    
    # Auto-install peers (optional, can be strict or auto)
    auto-install-peers=true
    ```

## Migration Strategy

### Phase 1: Local Development Migration
1. Install pnpm globally
2. Remove npm artifacts (`node_modules`, `package-lock.json`)
3. Run `pnpm install` to generate new lock file
4. Validate builds and tests
5. Commit `pnpm-lock.yaml`

### Phase 2: Documentation & Communication
1. Update all documentation to reference pnpm
2. Add setup instructions for new developers
3. Update project specs to include pnpm in conventions
4. Communicate change to team/contributors

### Phase 3: CI/CD Migration (if applicable)
1. Update workflows to install pnpm
2. Update cache keys and paths
3. Validate automated builds
4. Update deployment scripts if needed

## Rollback Plan
If critical issues arise during migration:
1. Restore `package-lock.json` from git history
2. Remove `pnpm-lock.yaml`
3. Run `npm install` to rebuild with npm
4. Document issues for future retry
5. Keep `node_modules` structure flat for npm compatibility

## pnpm Command Reference
Common npm commands and their pnpm equivalents:

| npm command | pnpm equivalent | Purpose |
|-------------|-----------------|---------|
| `npm install` | `pnpm install` | Install all dependencies |
| `npm install <pkg>` | `pnpm add <pkg>` | Add a package |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` | Add dev dependency |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` | Remove a package |
| `npm run <script>` | `pnpm run <script>` or `pnpm <script>` | Run a script |
| `npm update` | `pnpm update` | Update dependencies |
| `npm list` | `pnpm list` | List installed packages |

## Validation Checklist
After migration, verify:
- [ ] All dependencies install without errors
- [ ] `pnpm build` produces identical output to `npm run build`
- [ ] `pnpm test` passes all existing tests
- [ ] Scripts in `package.json` work: `dev`, `check-rates`, `arbitrage`
- [ ] TypeScript compilation works without errors
- [ ] No import errors from phantom dependencies
- [ ] Development workflow (`pnpm dev`) works as expected
- [ ] Size of `node_modules` is reasonable (may be different structure but similar or smaller size)

## Risks / Trade-offs

### Risk: Tool compatibility with non-hoisted node_modules
- **Description**: Some tools expect a flat `node_modules` structure
- **Likelihood**: Low - most modern tools support pnpm's structure
- **Mitigation**: 
    - Test all development tools after migration
    - Can enable selective hoisting in `.npmrc` if needed: `public-hoist-pattern[]=*eslint*`

### Risk: Developer learning curve
- **Description**: Developers familiar with npm may need to learn pnpm commands
- **Likelihood**: Medium
- **Mitigation**:
    - Provide clear documentation with command comparisons
    - pnpm commands are very similar to npm
    - Most differences are in underlying implementation, not usage

### Risk: CI/CD pipeline changes required
- **Description**: Build pipelines may need updates to use pnpm
- **Likelihood**: High if CI/CD exists
- **Mitigation**:
    - Test CI/CD changes in a separate branch first
    - Many CI platforms have built-in pnpm support
    - Fallback to manual pnpm installation is straightforward

### Trade-off: Stricter dependency management
- **Description**: pnpm prevents importing packages not in `package.json`
- **Impact**: May surface previously hidden dependency issues
- **Benefit**: Catches bugs early, ensures explicit dependencies
- **Mitigation**: Fix any phantom dependencies by adding them to `package.json`

## Open Questions
- ~~Which version of pnpm should we target?~~ **Resolved**: Latest stable (v9.x), enforced via `packageManager` field
- ~~Should we use strict peer dependencies?~~ **Resolved**: Yes, enable in `.npmrc` to catch compatibility issues early
- ~~Do we have any CI/CD that needs updating?~~ **To be determined**: Check during implementation phase
