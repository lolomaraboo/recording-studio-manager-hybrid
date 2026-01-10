# Task Completion Checklist

When completing any development task, follow these steps in order:

## 1. Type Check (MANDATORY)

```bash
pnpm check
```

**Requirement:** MUST have 0 TypeScript errors.

If there are errors:
- Fix all type errors before proceeding
- This project uses strict TypeScript - no exceptions

## 2. Code Formatting

```bash
pnpm format
```

**Action:** Runs Prettier on all modified files.

## 3. Unit Tests

```bash
# Run all unit tests
pnpm test

# Or run tests for specific package you modified
pnpm --filter database test
pnpm --filter server test
```

**Requirement:** All tests must pass.

If you modified database code:
```bash
# Check coverage (must be >80%)
pnpm --filter database test:coverage
```

## 4. E2E Tests (if applicable)

If you modified UI or API endpoints:

```bash
# Run relevant E2E tests
npx playwright test e2e/crud/clients-enriched.spec.ts

# Or run all E2E tests
npx playwright test
```

**Action:** Ensure E2E tests pass for affected features.

## 5. Manual Testing (Development)

```bash
# Start application
./start.sh

# Test your changes at:
# - Frontend: http://localhost:5174
# - Backend: http://localhost:3001
```

**Action:** Manually verify the feature works as expected.

## 6. Git Commit

```bash
git add .
git commit -m "descriptive message"
git push
```

**Convention:** Use clear, descriptive commit messages.

## Special Cases

### When Modifying Database Schema

1. Generate migration:
   ```bash
   pnpm db:generate
   ```

2. Apply migration:
   ```bash
   pnpm db:migrate
   ```

3. Test migration on clean database:
   ```bash
   # Drop and recreate database
   dropdb rsm_master
   createdb rsm_master
   pnpm db:migrate
   pnpm --filter database db:init
   ```

4. Update tests if schema changed

### When Modifying Docker Configuration

1. Clear cache:
   ```bash
   docker builder prune -af
   ```

2. Rebuild:
   ```bash
   docker-compose build --no-cache [service-name]
   ```

3. Restart:
   ```bash
   docker-compose restart [service-name]
   ```

4. Test in production mode:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

### When Adding New Dependencies

1. Install:
   ```bash
   pnpm --filter [package] add [dependency]
   ```

2. Verify lockfile updated:
   ```bash
   git status  # Should show pnpm-lock.yaml modified
   ```

3. Test build:
   ```bash
   pnpm build
   ```

### When Modifying tRPC Routers

1. Type check (types auto-update):
   ```bash
   pnpm check
   ```

2. Test endpoint manually:
   - Use tRPC client in frontend
   - Or test via HTTP directly

3. Update E2E tests if public API changed

### When Adding New shadcn/ui Components

```bash
cd packages/client
npx shadcn@latest add [component-name]
cd ../..
pnpm check
```

## Checklist Summary

- [ ] `pnpm check` passes with 0 errors
- [ ] `pnpm format` applied
- [ ] `pnpm test` all tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Git commit with descriptive message
- [ ] Special case steps completed (if applicable)
