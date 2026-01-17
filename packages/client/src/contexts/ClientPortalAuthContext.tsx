import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';

/**
 * Client Portal Authentication Context
 *
 * Manages client authentication state for the client portal:
 * - Session validation via tRPC me query (express-session cookies)
 * - Auto-login from server session
 * - Login/logout methods
 * - Current client data
 */

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface ClientPortalAuthContextType {
  client: Client | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (client: Client) => void;
  logout: () => void;
  updateClient: (client: Client) => void;
}

const ClientPortalAuthContext = createContext<ClientPortalAuthContextType | undefined>(
  undefined
);

interface ClientPortalAuthProviderProps {
  children: ReactNode;
}

export function ClientPortalAuthProvider({ children }: ClientPortalAuthProviderProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Query session from server (like Admin Portal auth.me)
  const meQuery = trpc.clientPortalAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (meQuery.data?.client) {
      setClient(meQuery.data.client);
    } else if (meQuery.error || meQuery.isError) {
      setClient(null);
    }
    setIsLoading(meQuery.isLoading);
  }, [meQuery.data, meQuery.error, meQuery.isError, meQuery.isLoading]);

  const login = (clientData: Client) => {
    setClient(clientData);
    // No localStorage - session cookie sent automatically by browser
  };

  const logout = () => {
    setClient(null);
    // Server destroys session via logout mutation
  };

  const updateClient = (clientData: Client) => {
    setClient(clientData);
  };

  const value: ClientPortalAuthContextType = {
    client,
    isAuthenticated: !!client,
    isLoading,
    login,
    logout,
    updateClient,
  };

  return (
    <ClientPortalAuthContext.Provider value={value}>
      {children}
    </ClientPortalAuthContext.Provider>
  );
}

/**
 * Hook to access client portal authentication context
 *
 * @throws {Error} If used outside of ClientPortalAuthProvider
 */
export function useClientPortalAuth() {
  const context = useContext(ClientPortalAuthContext);

  if (context === undefined) {
    throw new Error(
      'useClientPortalAuth must be used within a ClientPortalAuthProvider'
    );
  }

  return context;
}

/**
 * Higher-order component to protect client portal routes
 *
 * Usage:
 * ```tsx
 * <Route path="/client-portal" element={<ProtectedClientRoute><ClientDashboard /></ProtectedClientRoute>} />
 * ```
 */
interface ProtectedClientRouteProps {
  children: ReactNode;
}

export function ProtectedClientRoute({ children }: ProtectedClientRouteProps) {
  const { isAuthenticated, isLoading } = useClientPortalAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Declarative React Router redirect
    return <Navigate to="/client-portal/login" replace />;
  }

  return <>{children}</>;
}
