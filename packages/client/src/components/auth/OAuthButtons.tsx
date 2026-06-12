import { Button } from '@/components/ui/button';

/**
 * "Continue with Google / Apple" buttons.
 * Full-page redirect to the server OAuth flow (same origin: Vite proxy in dev,
 * nginx in production), which sets the session cookie then redirects back to /.
 */
export function OAuthButtons({ disabled }: { disabled?: boolean }) {
  const start = (provider: 'google' | 'apple') => {
    window.location.href = `/api/auth/oauth/${provider}/start`;
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={() => start('google')}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={() => start('apple')}
      >
        <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.36 12.79c-.03-2.65 2.17-3.93 2.27-3.99-1.24-1.81-3.16-2.06-3.84-2.09-1.63-.17-3.19.96-4.02.96-.83 0-2.11-.94-3.47-.91-1.78.03-3.43 1.04-4.35 2.63-1.86 3.22-.47 7.98 1.34 10.59.88 1.28 1.93 2.71 3.31 2.66 1.33-.05 1.83-.86 3.44-.86 1.6 0 2.06.86 3.46.83 1.43-.02 2.34-1.3 3.21-2.59 1.01-1.48 1.43-2.92 1.45-3-.03-.01-2.78-1.07-2.8-4.23zM13.72 4.99c.73-.89 1.23-2.12 1.09-3.35-1.06.04-2.34.7-3.1 1.59-.68.79-1.27 2.05-1.11 3.25 1.18.09 2.39-.6 3.12-1.49z" />
        </svg>
        Continue with Apple
      </Button>
    </div>
  );
}

/** Human-readable messages for ?error= codes set by the server OAuth flow. */
export function oauthErrorMessage(code: string): string {
  switch (code) {
    case 'cancelled':
      return 'Sign-in was cancelled.';
    case 'no_email':
      return 'Your account did not share an email address. Please use another sign-in method.';
    case 'google_not_configured':
    case 'apple_not_configured':
      return 'This sign-in method is not configured yet.';
    case 'account_disabled':
      return 'This account is disabled.';
    case 'invalid_state':
      return 'Sign-in session expired. Please try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}
