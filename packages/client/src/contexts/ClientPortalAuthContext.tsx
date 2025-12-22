import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Client Portal Authentication Context
 *
 * Manages client authentication state for the client portal:
 * - Session token storage (localStorage)
 * - Auto-login from stored token
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
  sessionToken: string | null;
  client: Client | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, client: Client) => void;
  logout: () => void;
  updateClient: (client: Client) => void;
}

const ClientPortalAuthContext = createContext<ClientPortalAuthContextType | undefined>(
  undefined
);

const SESSION_TOKEN_KEY = 'client_portal_session_token';
const CLIENT_DATA_KEY = 'client_portal_client_data';

interface ClientPortalAuthProviderProps {
  children: ReactNode;
}

export function ClientPortalAuthProvider({ children }: ClientPortalAuthProviderProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const storedClient = localStorage.getItem(CLIENT_DATA_KEY);

    if (storedToken && storedClient) {
      try {
        const parsedClient = JSON.parse(storedClient) as Client;
        setSessionToken(storedToken);
        setClient(parsedClient);
      } catch (error) {
        console.error('Failed to parse stored client data:', error);
        // Clear invalid data
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(CLIENT_DATA_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const login = (token: string, clientData: Client) => {
    setSessionToken(token);
    setClient(clientData);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(clientData));
  };

  const logout = () => {
    setSessionToken(null);
    setClient(null);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(CLIENT_DATA_KEY);
  };

  const updateClient = (clientData: Client) => {
    setClient(clientData);
    localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(clientData));
  };

  const value: ClientPortalAuthContextType = {
    sessionToken,
    client,
    isAuthenticated: !!sessionToken && !!client,
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
    // Redirect to login
    window.location.href = '/client-portal/login';
    return null;
  }

  return <>{children}</>;
}
