# Tech Stack - Recording Studio Manager

## Frontend Stack

- **React:** 19.1 (latest)
- **TypeScript:** 5.9 (strict mode enabled)
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS 4
- **UI Components:** shadcn/ui
- **API Client:** tRPC 11 client
- **Routing:** Wouter (lightweight React router)

## Backend Stack

- **Server:** Express 4
- **API Framework:** tRPC 11 server
- **ORM:** Drizzle ORM 0.44
- **Database Driver:** postgres (native PostgreSQL driver)
- **Database:** PostgreSQL (≥ 16)
- **Authentication:** JWT (jose library)
- **Real-time:** Socket.IO
- **Runtime:** tsx (TypeScript execution - no build step for server)

## Testing Stack

- **Unit Testing:** Vitest 2.1
  - Database package has >80% coverage requirement
- **E2E Testing:** Playwright 1.57
  - Tests against production/staging environments
  - Located in `e2e/` directory

## Development Tools

- **Package Manager:** pnpm 9.14.4 (workspace monorepo)
- **TypeScript Compiler:** 5.9.3
- **Database Migrations:** drizzle-kit 0.31.4
- **Database GUI:** Drizzle Studio
- **Code Formatting:** Prettier 3.6.2

## Additional Libraries

- **Payment Processing:** Stripe
- **File Formats:**
  - vcard4 (vCard 4.0 RFC 6350)
  - exceljs (Excel import/export)
  - csv-parse/csv-stringify (CSV handling)
- **Security:** bcrypt (password hashing)

## Browser Support

Primary browser for E2E tests: Chromium (headless: false for visibility)
