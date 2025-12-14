import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { trpc } from './trpc';

/**
 * User type matching the backend response
 */
interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  organizationId: number | null;
}

/**
 * 2FA pending state
 */
interface TwoFactorPending {
  userId: number;
  organizationId: number | null;
  email: string;
}

/**
 * Auth context value
 */
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  twoFactorPending: TwoFactorPending | null;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean }>;
  verifyTwoFactor: (token: string) => Promise<void>;
  verifyBackupCode: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Token storage key
const ACCESS_TOKEN_KEY = 'rsm_access_token';

/**
 * Get stored access token
 */
export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Store access token
 */
function setStoredAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorPending, setTwoFactorPending] = useState<TwoFactorPending | null>(null);

  const utils = trpc.useUtils();

  // Check authentication status on mount
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!accessToken,
    retry: false,
  });

  // Handle meQuery result changes (React Query v5 pattern)
  useEffect(() => {
    if (meQuery.isSuccess) {
      if (meQuery.data) {
        setUser(meQuery.data);
      } else {
        // Token is invalid or expired
        setAccessToken(null);
        setStoredAccessToken(null);
        setUser(null);
      }
      setIsLoading(false);
    } else if (meQuery.isError) {
      setAccessToken(null);
      setStoredAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, [meQuery.isSuccess, meQuery.isError, meQuery.data]);

  // Handle initial loading state when no token
  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
    }
  }, [accessToken]);

  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const refreshMutation = trpc.auth.refresh.useMutation();
  const verifyTwoFactorMutation = trpc.twoFactor.verifyLogin.useMutation();
  const verifyBackupCodeMutation = trpc.twoFactor.verifyBackupCode.useMutation();

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginMutation.mutateAsync({ email, password });

    if (data.requiresTwoFactor && 'userId' in data) {
      // Store pending 2FA state
      setTwoFactorPending({
        userId: data.userId,
        organizationId: data.organizationId,
        email: data.user.email,
      });
      return { requiresTwoFactor: true };
    }

    // No 2FA required, complete login
    if ('accessToken' in data && data.accessToken) {
      setAccessToken(data.accessToken);
      setStoredAccessToken(data.accessToken);
      setUser(data.user as User);
      // Invalidate all queries to refetch with new auth
      utils.invalidate();
    }
    return { requiresTwoFactor: false };
  }, [loginMutation, utils]);

  const verifyTwoFactor = useCallback(async (token: string) => {
    if (!twoFactorPending) {
      throw new Error('No 2FA verification pending');
    }

    const data = await verifyTwoFactorMutation.mutateAsync({
      userId: twoFactorPending.userId,
      token,
      organizationId: twoFactorPending.organizationId,
    });

    setTwoFactorPending(null);
    setAccessToken(data.accessToken);
    setStoredAccessToken(data.accessToken);
    setUser(data.user as User);
    utils.invalidate();
  }, [twoFactorPending, verifyTwoFactorMutation, utils]);

  const verifyBackupCode = useCallback(async (code: string) => {
    if (!twoFactorPending) {
      throw new Error('No 2FA verification pending');
    }

    const data = await verifyBackupCodeMutation.mutateAsync({
      userId: twoFactorPending.userId,
      code,
      organizationId: twoFactorPending.organizationId,
    });

    setTwoFactorPending(null);
    setAccessToken(data.accessToken);
    setStoredAccessToken(data.accessToken);
    setUser(data.user as User);
    utils.invalidate();
  }, [twoFactorPending, verifyBackupCodeMutation, utils]);

  const cancelTwoFactor = useCallback(() => {
    setTwoFactorPending(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Still clear local state on error
    } finally {
      setAccessToken(null);
      setStoredAccessToken(null);
      setUser(null);
      // Clear all cached data
      utils.invalidate();
    }
  }, [logoutMutation, utils]);

  const refreshTokenFn = useCallback(async () => {
    try {
      const data = await refreshMutation.mutateAsync();
      setAccessToken(data.accessToken);
      setStoredAccessToken(data.accessToken);
    } catch {
      // Refresh failed, user needs to login again
      setAccessToken(null);
      setStoredAccessToken(null);
      setUser(null);
    }
  }, [refreshMutation]);

  const value: AuthContextValue = {
    user,
    accessToken,
    isLoading: isLoading || meQuery.isLoading,
    isAuthenticated: !!user && !!accessToken,
    twoFactorPending,
    login,
    verifyTwoFactor,
    verifyBackupCode,
    cancelTwoFactor,
    logout,
    refreshToken: refreshTokenFn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
