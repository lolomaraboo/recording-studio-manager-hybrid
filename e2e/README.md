# E2E Test Suite - Recording Studio Manager

Comprehensive end-to-end testing suite for validating the entire application before marketing launch.

## 📁 Structure

```
e2e/
├── navigation/          # Page accessibility tests (53 pages)
│   └── all-pages.spec.ts
├── crud/                # CRUD operation tests (11 entities)
│   └── (to be created per entity)
├── interactions/        # UI interaction tests
│   └── (buttons, modals, forms, etc.)
├── workflows/           # Complete user journey tests
│   └── complete-journeys.spec.ts
├── features/            # Advanced feature tests
│   ├── ai-chatbot.spec.ts
│   ├── command-palette.spec.ts
│   └── global-search.spec.ts
├── auth/                # Authentication tests
│   └── login-and-signup.spec.ts
├── infrastructure/      # Production health tests
│   └── production-health.spec.ts
└── helpers/             # Shared utilities
    ├── login.ts
    ├── fixtures.ts
    └── screenshots.ts
```

## 🎯 Coverage Goals

### Navigation Tests (53 pages)
- **Staff Portal**: 44 pages
  - Dashboard, Sessions, Clients, Invoices, Rooms, Equipment
  - Projects, Tracks, Talents, Quotes, Contracts, Expenses
  - Calendar, Audio Files, Reports, Analytics, Chat, etc.
- **Client Portal**: 5 pages
  - Dashboard, Bookings, Profile
- **Auth Pages**: 4 pages
  - Staff Login, Staff Register, Client Login, Magic Link

### Workflow Tests (5 critical journeys)
1. **New Studio Onboarding**: Signup → First Client → First Session → First Invoice
2. **Client Booking Flow**: Client books → Studio approves
3. **Project Workflow**: Create project → Add tracks → Share
4. **Subscription Upgrade**: Free → Pro plan
5. **Invoice Flow**: Create → Send → Mark paid

### Feature Tests (6 advanced features)
1. **AI Chatbot**: 37 actions, SSE streaming, anti-hallucination
2. **Audio Player**: Upload, playback, versions, download
3. **Command Palette**: Cmd+K navigation and quick actions
4. **Global Search**: Multi-entity search and navigation
5. **Theme Toggle**: Dark/Light mode switching
6. **Notifications**: SSE stream, mark read

### Infrastructure Tests
- HTTPS/CORS configuration
- API health endpoints
- Production dashboard accessibility
- Multi-tenant subdomain routing

## 🚀 Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific category
```bash
# Navigation tests
npx playwright test e2e/navigation/

# Workflow tests
npx playwright test e2e/workflows/

# Feature tests
npx playwright test e2e/features/

# Auth tests
npx playwright test e2e/auth/

# Infrastructure tests
npx playwright test e2e/infrastructure/
```

### Run with UI mode
```bash
npx playwright test --ui
```

### Run specific file
```bash
npx playwright test e2e/workflows/complete-journeys.spec.ts
```

### Generate HTML report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

## 🔧 Configuration

Test configuration in `playwright.config.ts`:

- **Base URL**: `https://recording-studio-manager.com` (configurable via `BASE_URL` env var)
- **Timeout**: 60s per test
- **Retries**: 2 (in CI), 0 (local)
- **Screenshot**: On failure
- **Video**: On failure
- **Trace**: On first retry

### Environment Variables

```bash
# Test against different environment
BASE_URL=http://localhost:5174 npx playwright test

# CI mode (with retries)
CI=true npx playwright test
```

## 📸 Screenshots

Screenshots are automatically saved to `screenshots/` directory:

- Navigation tests: One screenshot per page
- Workflow tests: Screenshots at each major step
- Feature tests: Screenshots of key interactions
- Debug screenshots: On test failures

## 🐛 Debugging

### Debug a specific test
```bash
npx playwright test e2e/workflows/complete-journeys.spec.ts --debug
```

### Show browser (headed mode)
```bash
npx playwright test --headed
```

### Slow down execution
```bash
npx playwright test --headed --slow-mo=1000
```

### View trace
```bash
npx playwright show-trace trace.zip
```

## 📊 Test Reports

After running tests, view results:

```bash
# HTML report
npx playwright show-report

# JSON results
cat test-results/results.json | jq
```

## ✅ Pre-Launch Checklist

Before marketing launch, ensure:

- [ ] All 53 pages load without errors
- [ ] All 5 critical workflows complete successfully
- [ ] All 6 advanced features work correctly
- [ ] No CORS or HTTPS errors in production
- [ ] API health endpoints return 200
- [ ] No console errors on any page
- [ ] All authentication flows work
- [ ] Session persistence works correctly

## 🔄 CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run E2E tests
  run: |
    npx playwright install --with-deps
    npx playwright test
  env:
    BASE_URL: https://recording-studio-manager.com
```

## 📝 Writing New Tests

### Use helpers
```typescript
import { loginAsStaff, loginAsClient } from '../helpers/login';
import { generateEmail, getClientData } from '../helpers/fixtures';
import { takeFullPageScreenshot } from '../helpers/screenshots';
```

### Test structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');

    // Act
    await page.click('button');

    // Assert
    await expect(page).toHaveURL('/expected-url');

    // Screenshot
    await takeFullPageScreenshot(page, 'test-name');
  });
});
```

## 🎯 Test Philosophy

1. **User-focused**: Test what users actually do, not implementation details
2. **Comprehensive**: Cover every page, every button, every workflow
3. **Resilient**: Use flexible selectors, handle timing issues gracefully
4. **Maintainable**: DRY principle, shared helpers, clear structure
5. **Fast**: Parallel execution, minimal waits, smart retries

## 🚧 Known Limitations

- **Client Portal**: Some features require manual client account setup
- **Payment Tests**: Stripe tests require test mode API keys
- **File Upload**: Audio file tests need test fixtures
- **Email**: Email sending tests may require email service mocking

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generation](https://playwright.dev/docs/codegen)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

Last updated: 2025-12-26
Phase: 3.2 - End-to-End Testing
