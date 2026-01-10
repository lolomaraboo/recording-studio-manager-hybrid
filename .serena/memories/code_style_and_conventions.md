# Code Style and Conventions

## TypeScript Configuration

**Strict Mode:** Enabled with ALL strict options

### Compiler Options (tsconfig.json)
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `strictBindCallApply: true`
- `strictPropertyInitialization: true`
- `noImplicitThis: true`
- `alwaysStrict: true`

### Additional Checks
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `allowUnusedLabels: false`
- `allowUnreachableCode: false`

**CRITICAL:** The project MUST have 0 TypeScript errors. Run `pnpm check` before committing.

## Naming Conventions

### Variables and Functions
- **camelCase** for variables and functions
  - Examples: `getUserById`, `tenantDb`, `organizationId`

### Types and Interfaces
- **PascalCase** for types, interfaces, and classes
  - Examples: `MasterDb`, `TenantDb`, `CreateClientInput`

### Constants
- **camelCase** for regular constants
- **UPPER_SNAKE_CASE** for environment variables
  - Examples: `_masterDb`, `DATABASE_URL`

### Files and Directories
- **kebab-case** for file names
  - Examples: `global-setup.ts`, `vcard-service.ts`
- **lowercase** for directory names
  - Examples: `routers`, `middleware`, `utils`

## Code Organization

### Monorepo Package Structure
```
packages/
├── shared/        # Shared types and utilities
├── database/      # Database schemas and connection logic
├── server/        # Backend API and business logic
└── client/        # Frontend UI and components
```

### Router Pattern (tRPC)

All routers follow this pattern:
```typescript
export const myRouter = router({
  myQuery: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      // Query tenant-specific data
      return tenantDb.query.myTable.findFirst(...);
    }),
});
```

### Import Organization

1. External dependencies first
2. Internal package imports
3. Relative imports
4. Type imports last (if needed)

## Formatting

- **Tool:** Prettier 3.6.2
- **Command:** `pnpm format`
- No explicit `.prettierrc` file - uses Prettier defaults

## Comments and Documentation

- Use JSDoc comments for public APIs
- Inline comments for complex logic
- No need for obvious comments (code should be self-documenting)

## File Structure Conventions

### Database Package
- `src/master/schema.ts` - Master database schema
- `src/tenant/schema.ts` - Tenant database schema
- `src/connection.ts` - Connection manager
- `src/scripts/` - Database utility scripts

### Server Package
- `src/routers/` - tRPC routers
- `src/middleware/` - Express middleware
- `src/utils/` - Utility functions
- `src/services/` - Business logic services
- `src/webhooks/` - Webhook handlers

### Client Package
- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/lib/` - Client utilities
- `src/hooks/` - Custom React hooks
