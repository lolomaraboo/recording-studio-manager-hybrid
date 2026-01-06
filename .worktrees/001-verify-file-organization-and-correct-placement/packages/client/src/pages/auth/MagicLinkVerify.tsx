import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Music, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

type VerificationState = 'verifying' | 'success' | 'error';

/**
 * Magic Link Verification Page
 *
 * Validates magic link token and auto-logs in the user
 * URL: /auth/magic-link?token=...
 */
export default function MagicLinkVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useClientPortalAuth();
  const [state, setState] = useState<VerificationState>('verifying');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const verifyMagicLinkMutation = trpc.clientPortalAuth.verifyMagicLink.useMutation();

  useEffect(() => {
    if (!token) {
      setState('error');
      setError('Invalid magic link. No token provided.');
      return;
    }

    if (token.length !== 64) {
      setState('error');
      setError('Invalid magic link token format.');
      return;
    }

    // Auto-verify on mount
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;

    setState('verifying');
    setError(null);

    try {
      const result = await verifyMagicLinkMutation.mutateAsync({ token });

      if (result.purpose === 'email_verification') {
        setState('success');
        setError('Email verified successfully! You can now log in.');
        setTimeout(() => navigate('/client-portal/login'), 3000);
        return;
      }

      // For login magic links, authenticate and redirect
      if (result.purpose === 'login' && result.sessionToken && result.client) {
        login(result.sessionToken, result.client);
        setState('success');
        setTimeout(() => navigate('/client-portal'), 1500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Failed to verify magic link. It may have expired or already been used.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {state === 'verifying' && 'Verifying Magic Link...'}
            {state === 'success' && 'Verification Successful!'}
            {state === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {state === 'verifying' && 'Please wait while we verify your magic link'}
            {state === 'success' && 'Redirecting you to the portal...'}
            {state === 'error' && 'There was a problem with your magic link'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state === 'verifying' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Validating your authentication token...
              </p>
            </div>
          )}

          {state === 'success' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Success!</strong> You're being redirected to the Studio Portal.
              </AlertDescription>
            </Alert>
          )}

          {state === 'error' && (
            <>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/client-portal/login')}
                >
                  Back to Login
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Need a new link?{' '}
                  <a
                    href="/client-portal/login"
                    className="text-primary hover:underline"
                  >
                    Request another magic link
                  </a>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
