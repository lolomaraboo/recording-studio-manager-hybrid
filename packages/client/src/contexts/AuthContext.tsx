import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Load user on mount
  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data.user);
      setOrganization(meQuery.data.organization);
    } else if (meQuery.error || meQuery.isError) {
      setUser(null);
      setOrganization(null);
    }
    setIsLoading(meQuery.isLoading);
  }, [meQuery.data, meQuery.error, meQuery.isError, meQuery.isLoading]);

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    setUser(result.user);
    setOrganization(result.organization);

    // Refetch to ensure session is properly set
    await meQuery.refetch();
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => {
    const result = await registerMutation.mutateAsync({
      email,
      password,
      name,
      organizationName,
    });
    setUser(result.user);
    setOrganization(result.organization);

    // Refetch to ensure session is properly set
    await meQuery.refetch();
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
    setOrganization(null);

    // Refetch to clear cache
    await meQuery.refetch();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
