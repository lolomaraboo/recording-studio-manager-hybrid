import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { trpc } from './trpc';

/**
 * Client user type (from client portal)
 */
interface ClientUser {
  id: number;
  name: string;
  artistName: string | null;
  email: string | null;
  isVip: boolean;
}

/**
 * Client auth context value
 */
interface ClientAuthContextValue {
  client: ClientUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

// Token storage key (separate from staff tokens)
const CLIENT_ACCESS_TOKEN_KEY = 'rsm_client_access_token';

/**
 * Get stored client access token
 */
export function getStoredClientAccessToken(): string | null {
  return localStorage.getItem(CLIENT_ACCESS_TOKEN_KEY);
}

/**
 * Store client access token
 */
function setStoredClientAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(CLIENT_ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(CLIENT_ACCESS_TOKEN_KEY);
  }
}

/**
 * Client Auth Provider component
 *
 * Separate from staff auth - clients authenticate through clientAuth router
 */
export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredClientAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();

  // Check client authentication status on mount
  const meQuery = trpc.clientAuth.me.useQuery(undefined, {
    enabled: !!accessToken,
    retry: false,
  });

  // Handle meQuery result changes
  useEffect(() => {
    if (meQuery.isSuccess) {
      if (meQuery.data) {
        setClient(meQuery.data);
      } else {
        // Token is invalid or expired
        setAccessToken(null);
        setStoredClientAccessToken(null);
        setClient(null);
      }
      setIsLoading(false);
    } else if (meQuery.isError) {
      setAccessToken(null);
      setStoredClientAccessToken(null);
      setClient(null);
      setIsLoading(false);
    }
  }, [meQuery.isSuccess, meQuery.isError, meQuery.data]);

  // Handle initial loading state when no token
  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
    }
  }, [accessToken]);

  const loginMutation = trpc.clientAuth.login.useMutation();
  const logoutMutation = trpc.clientAuth.logout.useMutation();
  const refreshMutation = trpc.clientAuth.refresh.useMutation();

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginMutation.mutateAsync({ email, password });
    setAccessToken(data.accessToken);
    setStoredClientAccessToken(data.accessToken);
    setClient(data.client);
    // Invalidate all queries to refetch with new auth
    utils.invalidate();
  }, [loginMutation, utils]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Still clear local state on error
    } finally {
      setAccessToken(null);
      setStoredClientAccessToken(null);
      setClient(null);
      // Clear all cached data
      utils.invalidate();
    }
  }, [logoutMutation, utils]);

  const refreshTokenFn = useCallback(async () => {
    try {
      const data = await refreshMutation.mutateAsync();
      setAccessToken(data.accessToken);
      setStoredClientAccessToken(data.accessToken);
    } catch {
      // Refresh failed, client needs to login again
      setAccessToken(null);
      setStoredClientAccessToken(null);
      setClient(null);
    }
  }, [refreshMutation]);

  const value: ClientAuthContextValue = {
    client,
    accessToken,
    isLoading: isLoading || meQuery.isLoading,
    isAuthenticated: !!client && !!accessToken,
    login,
    logout,
    refreshToken: refreshTokenFn,
  };

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>;
}

/**
 * Hook to access client auth context
 */
export function useClientAuth(): ClientAuthContextValue {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}
