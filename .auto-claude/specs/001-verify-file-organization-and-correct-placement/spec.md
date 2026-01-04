# Specification: File Organization Verification and Audit

## Overview

Perform a comprehensive read-only audit of the project's file organization and directory structure. The user suspects files may be misplaced or disorganized. This task will verify that all files are properly located according to monorepo best practices, create a detailed report of findings, and provide recommendations without making any modifications to the codebase.

## Workflow Type

**Type**: investigation

**Rationale**: This is a read-only exploratory task focused on analyzing and documenting the current state of the codebase organization. No code changes or refactoring will be performed - only assessment and reporting.

## Task Scope

### Services Involved
- **All services** (database, server, shared, client) - comprehensive project-wide audit
- **Root directory** - monorepo configuration and tooling files
- **Infrastructure** - Docker, CI/CD, and deployment configurations

### This Task Will:
- [ ] Survey entire directory structure across all packages
- [ ] Verify files are located in appropriate service directories
- [ ] Check for orphaned, misplaced, or duplicate files
- [ ] Assess adherence to TypeScript/Node.js/React best practices
- [ ] Validate monorepo conventions (pnpm-workspace)
- [ ] Identify configuration files in unexpected locations
- [ ] Generate a comprehensive organization audit report

### Out of Scope:
- Moving or renaming any files
- Modifying code or configuration
- Implementing new organizational structure
- Running linters or formatters
- Fixing any identified issues (report only)

## Service Context

### Database Package

**Tech Stack:**
- Language: TypeScript
- Framework: None (ORM library)
- ORM: Drizzle
- Key directories: `src/`

**Entry Point:** `packages/database/src/index.ts`

**How to Run:**
```bash
cd packages/database
npm run dev
```

**Port:** N/A (library package)

---

### Server Package

**Tech Stack:**
- Language: TypeScript
- Framework: Express
- ORM: Drizzle
- Key directories: `src/`, `dist/`

**Entry Point:** `packages/server/src/index.ts`

**How to Run:**
```bash
cd packages/server
npm run dev
```

**Port:** 3001

---

### Shared Package

**Tech Stack:**
- Language: TypeScript
- Framework: None (utility library)
- Key directories: `src/`

**Entry Point:** `packages/shared/src/index.ts`

**How to Run:**
```bash
cd packages/shared
npm run dev
```

**Port:** N/A (library package)

---

### Client Package

**Tech Stack:**
- Language: TypeScript
- Framework: React
- Build Tool: Vite
- Styling: Tailwind CSS
- Key directories: `src/`

**Entry Point:** `packages/client/src/App.tsx`

**How to Run:**
```bash
cd packages/client
npm run dev
```

**Port:** 3000

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| *(No files to modify - read-only audit)* | N/A | N/A |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `packages/database/src/index.ts` | Entry point structure for packages |
| `packages/server/src/index.ts` | Server entry point organization |
| `packages/client/src/App.tsx` | Client entry point organization |
| `pnpm-workspace.yaml` | Monorepo package structure |
| `docker-compose.yml` | Infrastructure configuration location |

## Patterns to Follow

### Monorepo Package Structure

Expected structure for each package:

```
packages/[package-name]/
├── src/                  # Source code
│   ├── index.ts         # Entry point
│   ├── [modules]/       # Feature modules
│   └── ...
├── dist/                # Build output (if applicable)
├── package.json         # Package dependencies
├── tsconfig.json        # TypeScript config
├── .env.example         # Environment template
└── README.md            # Package documentation
```

**Key Points:**
- All source code should be in `src/` directory
- Entry points should be at `src/index.ts`
- Configuration files at package root
- No source code files at monorepo root

### TypeScript Project Organization

From project conventions:

```typescript
// All services use TypeScript
// Shared types should be in packages/shared
// Service-specific code stays within service boundaries
```

**Key Points:**
- TypeScript configuration per package
- Shared utilities in `@rsm/shared`
- Database schemas in `@rsm/database`
- No cross-package imports except declared dependencies

### Configuration File Locations

Expected locations:

```
# Root level (monorepo-wide)
- pnpm-workspace.yaml
- docker-compose.yml
- .gitignore
- README.md

# Package level (per service)
- packages/[service]/.env.example
- packages/[service]/tsconfig.json
- packages/[service]/package.json
- packages/[service]/Dockerfile (for server/client)
```

**Key Points:**
- Monorepo config at root
- Service config at package root
- Environment files should have `.example` templates
- Dockerfiles in packages that need containerization

## Requirements

### Functional Requirements

1. **Directory Structure Mapping**
   - Description: Generate complete directory tree showing all files and folders
   - Acceptance: Tree shows packages/, each service subdirectory, and root-level files

2. **File Location Validation**
   - Description: Verify files are in appropriate directories based on their purpose
   - Acceptance: Each file checked against expected location patterns for its type

3. **Misplaced File Detection**
   - Description: Identify files that should be moved to different locations
   - Acceptance: List of files with current location and recommended location

4. **Orphaned File Detection**
   - Description: Find files that may be unused, outdated, or serve no clear purpose
   - Acceptance: List of potentially orphaned files with reasoning

5. **Convention Compliance Check**
   - Description: Assess adherence to monorepo, TypeScript, and framework-specific conventions
   - Acceptance: Report on compliance with documented best practices

6. **Duplicate Detection**
   - Description: Identify duplicate or redundant files across packages
   - Acceptance: List of duplicates with locations and recommendations

7. **Report Generation**
   - Description: Create comprehensive markdown report summarizing all findings
   - Acceptance: Report includes summary, detailed findings, and recommendations

### Edge Cases

1. **Hidden Files** - Check dotfiles and hidden directories (`.git`, `.env`, `.auto-claude`, etc.)
2. **Build Artifacts** - Identify if `dist/`, `node_modules/`, or build outputs are properly gitignored
3. **Configuration Variants** - Handle multiple environment configs (`.env.example`, `.env.production`)
4. **Documentation Files** - Verify README.md placement at both root and package levels
5. **Test Files** - Check if test files follow naming conventions (`*.test.ts`, `*.spec.ts`)

## Implementation Notes

### DO
- Use `Glob` tool extensively to find files by pattern
- Use `Bash` with `tree` or `find` commands for directory visualization
- Read package.json files to understand package dependencies
- Check .gitignore to see what's intentionally excluded
- Document current state accurately before making recommendations
- Consider language/framework-specific conventions (TypeScript, React, Express)
- Reference monorepo best practices for pnpm-workspace projects

### DON'T
- Move, rename, or delete any files
- Modify any configuration files
- Make assumptions without verification
- Run build commands or install dependencies
- Create new files except the audit report
- Skip checking hidden directories and dotfiles

## Development Environment

### Start Services

```bash
# Not required for this audit task
# This is a read-only investigation
```

### Service URLs
- Server: http://localhost:3001 (not needed for audit)
- Client: http://localhost:3000 (not needed for audit)

### Required Environment Variables
- None (read-only task, no services started)

## Success Criteria

The task is complete when:

1. [ ] Complete directory tree generated showing all project files
2. [ ] All packages (database, server, shared, client) audited individually
3. [ ] Root-level files and configurations reviewed
4. [ ] Misplaced files identified with specific locations and recommendations
5. [ ] Orphaned or duplicate files flagged
6. [ ] Convention compliance assessed (monorepo, TypeScript, framework-specific)
7. [ ] Comprehensive audit report created in markdown format
8. [ ] Report includes summary, findings, and actionable recommendations
9. [ ] No files were modified during the audit process
10. [ ] User can understand project organization health from the report

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Audit Completeness
| Check | What to Verify | Expected |
|-------|---------------|----------|
| Directory Coverage | All packages audited | `database/`, `server/`, `shared/`, `client/` all covered |
| Root Files | Root-level files reviewed | Configuration, Docker, docs all checked |
| Hidden Files | Dotfiles examined | `.gitignore`, `.env.example` files assessed |

### Report Quality
| Check | What to Verify | Expected |
|-------|----------------|----------|
| Report Exists | Audit report created | Markdown file with findings generated |
| Summary Section | Executive summary present | High-level overview of organization health |
| Detailed Findings | Specific issues documented | Each misplaced/orphaned file listed with location |
| Recommendations | Actionable guidance provided | Clear next steps if issues found |

### Accuracy Verification
| Check | Command | Expected |
|-------|---------|----------|
| No Modifications Made | `git status` | No modified files (working tree clean) |
| Files Still in Original Locations | `find packages/ -type f \| wc -l` | File count unchanged from baseline |
| Report File Created | `ls -la *report*.md` | Audit report file exists |

### Organization Assessment
| Area | What to Check | Pass Criteria |
|------|---------------|---------------|
| Monorepo Structure | Packages in `packages/` directory | All services contained properly |
| Configuration Files | Root vs package-level configs | Appropriate separation verified |
| Source Code Location | All code in `src/` directories | No source files at wrong levels |
| Build Artifacts | `dist/`, `node_modules/` ignored | Proper .gitignore entries |

### Convention Compliance
| Convention | Check | Expected |
|------------|-------|----------|
| TypeScript | `tsconfig.json` per package | Each service has TS config |
| Package Manager | `pnpm-workspace.yaml` at root | Monorepo tool properly configured |
| Entry Points | `src/index.ts` pattern | Consistent entry point naming |
| Environment Files | `.env.example` templates | Environment variables documented |

### QA Sign-off Requirements
- [ ] All packages (database, server, shared, client) audited
- [ ] Root directory structure reviewed
- [ ] Misplaced files identified and documented
- [ ] Orphaned files flagged with reasoning
- [ ] Convention compliance assessed
- [ ] Comprehensive audit report created
- [ ] Report includes actionable recommendations
- [ ] No files were modified (git working tree clean)
- [ ] Report is clear and well-organized
- [ ] User can act on findings without additional investigation

---

## Audit Report Template

The final audit report should follow this structure:

```markdown
# File Organization Audit Report
**Date:** [timestamp]
**Project:** Recording Studio Manager (Hybrid Monorepo)

## Executive Summary
[High-level assessment: organized/needs improvement/critical issues]

## Directory Structure Overview
[Tree visualization or summary of packages]

## Findings

### ✅ Well-Organized Areas
- [Areas following best practices]

### ⚠️ Issues Detected
- [Misplaced files with recommendations]
- [Orphaned files with reasoning]
- [Convention violations]

### 📊 Statistics
- Total files: [count]
- Packages: [count]
- Misplaced files: [count]
- Orphaned files: [count]

## Recommendations
[Prioritized list of actions if issues found]

## Conclusion
[Overall assessment and next steps]
```
