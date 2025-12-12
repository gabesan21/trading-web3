# package-manager Specification

## Purpose
TBD - created by archiving change migrate-to-pnpm. Update Purpose after archive.
## Requirements
### Requirement: pnpm as Default Package Manager
The project MUST use pnpm as the default and only package manager for dependency management.

**Rationale**: 
- Efficient disk space usage through content-addressable storage
- Faster installation times compared to npm
- Stricter dependency resolution prevents phantom dependencies
- Better prepared for future monorepo expansion

#### Scenario: Developer sets up project for first time
```
GIVEN a developer clones the repository
WHEN they read the setup instructions
THEN they are instructed to install pnpm globally
AND they run `pnpm install` to install dependencies
AND a `pnpm-lock.yaml` file is present
AND a `node_modules` directory is created with pnpm's structure
```

#### Scenario: Developer adds a new dependency
```
GIVEN a developer needs to add a new package
WHEN they run `pnpm add <package-name>`
THEN the package is added to `package.json` dependencies
AND the `pnpm-lock.yaml` is updated
AND the package is installed to `node_modules`
```

#### Scenario: Developer removes a dependency
```
GIVEN a developer needs to remove a package
WHEN they run `pnpm remove <package-name>`
THEN the package is removed from `package.json`
AND the `pnpm-lock.yaml` is updated
AND the package is removed from `node_modules`
```

---

### Requirement: Lock File Management
The project MUST maintain a `pnpm-lock.yaml` file that is tracked in version control and used for reproducible installations.

**Rationale**:
- Ensures consistent dependency versions across all environments
- Allows review of dependency changes in pull requests
- Prevents "works on my machine" issues

#### Scenario: Lock file ensures reproducible builds
```
GIVEN a `pnpm-lock.yaml` file is committed to the repository
WHEN any developer runs `pnpm install`
THEN the exact same dependency versions are installed
AND the build output is identical across machines
```

#### Scenario: Lock file changes are reviewed
```
GIVEN a developer adds or updates a dependency
WHEN they commit their changes
THEN the `pnpm-lock.yaml` diff shows which packages changed
AND reviewers can verify the dependency modifications
```

#### Scenario: npm lock file is not present
```
GIVEN the project uses pnpm exclusively
WHEN a developer checks the repository
THEN no `package-lock.json` file exists
AND no `yarn.lock` file exists
AND only `pnpm-lock.yaml` is present
```

---

### Requirement: Package Manager Version Enforcement
The project MUST specify the required pnpm version in `package.json` to ensure compatibility.

**Rationale**:
- Prevents issues from version mismatches
- Ensures all developers use a compatible pnpm version
- Modern Node.js versions automatically use the specified package manager

#### Scenario: package.json specifies pnpm version
```
GIVEN the `package.json` file
WHEN it is inspected
THEN it contains a `packageManager` field
AND the field value is `pnpm@9.x.x` or later
```

#### Scenario: Corepack enforces package manager version
```
GIVEN Node.js 16.13+ with Corepack enabled
WHEN a developer runs `pnpm install`
THEN Corepack automatically uses the version specified in `packageManager`
AND warns if a different version is globally installed
```

---

### Requirement: Project Configuration Support
The project MUST support pnpm configuration via `.npmrc` file when custom settings are required.

**Rationale**:
- Allows project-specific customization of pnpm behavior
- Can enforce stricter dependency management
- Documents pnpm settings for all developers

#### Scenario: .npmrc configures strict peer dependencies
```
GIVEN a `.npmrc` file exists in the project root
WHEN it contains `strict-peer-dependencies=true`
THEN pnpm will fail installation if peer dependencies don't match
AND dependency conflicts are caught early
```

#### Scenario: .npmrc configures frozen lockfile for CI
```
GIVEN a `.npmrc` file exists in the project root
WHEN it contains `prefer-frozen-lockfile=true`
THEN CI builds will fail if `pnpm-lock.yaml` is out of sync
AND developers are forced to commit lock file changes
```

#### Scenario: pnpm works without .npmrc
```
GIVEN no `.npmrc` file exists in the project
WHEN a developer runs `pnpm install`
THEN pnpm uses default settings
AND installation completes successfully
```

---

### Requirement: npm Script Compatibility
All npm scripts in `package.json` MUST remain compatible with pnpm without modification.

**Rationale**:
- pnpm supports npm script syntax natively
- No need to rewrite existing scripts during migration
- Developers can use `pnpm run <script>` or `pnpm <script>` interchangeably

#### Scenario: Existing scripts work with pnpm
```
GIVEN scripts defined in `package.json` (build, test, dev, etc.)
WHEN a developer runs `pnpm run build`
THEN the build script executes identically to `npm run build`
AND no script modifications are required
```

#### Scenario: Script shortcuts work
```
GIVEN a script named `test` in `package.json`
WHEN a developer runs `pnpm test` (without `run`)
THEN the test script executes successfully
AND pnpm automatically recognizes common script shortcuts
```

---

### Requirement: Documentation and Developer Guidance
The project MUST provide clear documentation on pnpm usage, installation, and common commands.

**Rationale**:
- Reduces friction for new developers
- Provides reference for developers transitioning from npm/yarn
- Documents project-specific conventions

#### Scenario: README includes pnpm setup instructions
```
GIVEN a new developer reads the README
WHEN they reach the setup section
THEN they find instructions to install pnpm globally
AND they find the command to install dependencies: `pnpm install`
AND they find common pnpm commands for daily development
```

#### Scenario: Project specs document pnpm as standard
```
GIVEN the `openspec/project.md` file
WHEN the Tech Stack section is inspected
THEN pnpm is listed as the package manager
AND the Project Conventions section includes pnpm usage guidelines
```

#### Scenario: Migration guide available for developers
```
GIVEN a developer familiar with npm
WHEN they need to use pnpm
THEN documentation provides a command comparison table
AND explains key differences (e.g., `pnpm add` vs `npm install`)
```

---

### Requirement: Git Configuration
The project's `.gitignore` MUST properly handle pnpm-specific files and directories.

**Rationale**:
- Prevents committing unnecessary files
- Ensures lock file is tracked
- Maintains clean repository

#### Scenario: node_modules is ignored
```
GIVEN the `.gitignore` file
WHEN it is inspected
THEN it includes `node_modules/`
AND the pnpm-created `node_modules` directory is not tracked
```

#### Scenario: pnpm-lock.yaml is tracked
```
GIVEN the `.gitignore` file
WHEN it is inspected
THEN `pnpm-lock.yaml` is NOT in `.gitignore`
AND the lock file is tracked in version control
```

#### Scenario: npm lock file is prevented
```
GIVEN the `.gitignore` file
WHEN it is inspected
THEN it includes `package-lock.json` and `yarn.lock`
AND these files are prevented from being accidentally committed
```

---

### Requirement: No Phantom Dependencies
The project MUST NOT rely on phantom dependencies (packages not explicitly declared in `package.json`).

**Rationale**:
- pnpm's non-flat node_modules structure prevents importing undeclared packages
- Ensures dependency graph is accurate
- Prevents breakage when dependencies change their dependencies

#### Scenario: All imports are from declared dependencies
```
GIVEN the project source code
WHEN any file imports a package
THEN that package is listed in `package.json` dependencies or devDependencies
AND no imports rely on transitive dependencies
```

#### Scenario: Build fails on phantom dependency
```
GIVEN a file imports a package not in `package.json`
WHEN the project is built with pnpm
THEN the build fails with a module not found error
AND the developer is forced to add the missing dependency
```

---

