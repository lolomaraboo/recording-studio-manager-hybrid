import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';

/**
 * Client Portal Login Page
 *
 * Dual authentication system:
 * - Tab 1: Email/Password login
 * - Tab 2: Magic Link (passwordless)
 */
export default function ClientLogin() {
  const navigate = useNavigate();
  const { login: authLogin } = useClientPortalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email/Password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Magic Link form
  const [magicEmail, setMagicEmail] = useState('');

  // tRPC mutations
  const loginMutation = trpc.clientPortalAuth.login.useMutation();
  const requestMagicLinkMutation = trpc.clientPortalAuth.requestMagicLink.useMutation();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      console.log('Login successful:', result);

      // Store session in context (localStorage)
      authLogin(result.sessionToken, result.client);

      toast.success('Login successful!');
      // Navigate to client portal index (dashboard)
      navigate('/client-portal');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await requestMagicLinkMutation.mutateAsync({ email: magicEmail });
      console.log('Magic link request:', result);

      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link.');
      toast.error('Failed to send magic link');
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-2xl font-bold">Client Portal</CardTitle>
          <CardDescription>
            Sign in to access your bookings, invoices, and projects
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>

            {/* Email/Password Login */}
            <TabsContent value="password" className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/client-portal/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </TabsContent>

            {/* Magic Link Login */}
            <TabsContent value="magic-link" className="space-y-4 mt-4">
              {magicLinkSent ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Magic link sent to <strong>{magicEmail}</strong>! Check your
                    email and click the link to sign in. The link expires in 24
                    hours.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Enter your email to receive a magic link. No password needed!
                    </p>
                  </div>

                  <form onSubmit={handleMagicLinkRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          value={magicEmail}
                          onChange={(e) => setMagicEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Magic Link'}
                    </Button>
                  </form>
                </>
              )}

              {magicLinkSent && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setMagicEmail('');
                  }}
                >
                  Send Another Link
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/client-portal/register"
              className="text-primary hover:underline font-medium"
            >
              Contact us
            </Link>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Need help?{' '}
            <a href="mailto:support@studio.com" className="text-primary hover:underline">
              support@studio.com
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
