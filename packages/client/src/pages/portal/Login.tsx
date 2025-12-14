import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useClientAuth } from '@/lib/clientAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Music } from 'lucide-react';

/**
 * Client Portal Login Page
 *
 * Separate login for studio clients to access their self-service portal.
 */
export function PortalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useClientAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to portal dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/portal';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to your client portal!');
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
              <Music className="h-8 w-8 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Client Portal
          </CardTitle>
          <CardDescription>
            Sign in to view your sessions, invoices, and projects
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
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
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in to Portal'}
            </Button>
            <div className="text-sm text-gray-500 text-center space-y-2">
              <p>
                Don't have portal access?{' '}
                <span className="text-purple-600">Contact the studio</span>
              </p>
              <p className="border-t pt-2">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-400">
                  Staff login
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
