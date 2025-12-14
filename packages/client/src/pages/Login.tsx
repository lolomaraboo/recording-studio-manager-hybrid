import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, twoFactorPending, verifyTwoFactor, verifyBackupCode, cancelTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.requiresTwoFactor) {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
      // If 2FA required, the UI will show the 2FA form
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!twoFactorCode) {
      toast.error('Please enter your verification code');
      return;
    }

    setIsLoading(true);
    try {
      if (useBackupCode) {
        await verifyBackupCode(twoFactorCode);
      } else {
        await verifyTwoFactor(twoFactorCode);
      }
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid verification code';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancelTwoFactor() {
    cancelTwoFactor();
    setTwoFactorCode('');
    setUseBackupCode(false);
  }

  // Show 2FA verification form
  if (twoFactorPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-center">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleTwoFactorSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">
                  {useBackupCode ? 'Backup Code' : 'Verification Code'}
                </Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                  value={twoFactorCode}
                  onChange={(e) => {
                    if (useBackupCode) {
                      setTwoFactorCode(e.target.value.toUpperCase());
                    } else {
                      setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }
                  }}
                  disabled={isLoading}
                  className={useBackupCode ? '' : 'text-center text-2xl tracking-widest font-mono'}
                  autoFocus
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Signing in as {twoFactorPending.email}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || (!useBackupCode && twoFactorCode.length !== 6)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
              <div className="flex items-center justify-between w-full text-sm">
                <button
                  type="button"
                  onClick={handleCancelTwoFactor}
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                  }}
                  className="text-purple-600 hover:text-purple-800"
                >
                  {useBackupCode ? 'Use authenticator app' : 'Use backup code'}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Show regular login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Recording Studio Manager
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Demo: admin@studiopro.com / admin123
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
