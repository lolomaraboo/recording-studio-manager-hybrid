/**
 * Branding Provider
 *
 * Provides organization branding context (colors, logo, theme)
 * and applies CSS variables for dynamic theming.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { trpc } from './trpc';
import { useAuth } from './auth';

// ============================================================================
// Types
// ============================================================================

interface BrandingConfig {
  organizationId: number;
  organizationName: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  emailFromName: string | null;
  emailFooterText: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;
}

interface BrandingContextValue {
  branding: BrandingConfig | null;
  theme: {
    colors: ThemeColors;
    cssVariables: Record<string, string>;
  } | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

// Default branding values
const DEFAULT_BRANDING: BrandingConfig = {
  organizationId: 0,
  organizationName: 'Studio',
  slug: 'default',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#7c3aed',
  secondaryColor: '#a855f7',
  accentColor: '#6366f1',
  emailFromName: null,
  emailFooterText: null,
  customDomain: null,
  customDomainVerified: false,
};

// ============================================================================
// Context
// ============================================================================

const BrandingContext = createContext<BrandingContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface BrandingProviderProps {
  children: ReactNode;
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const { isAuthenticated } = useAuth();

  // Fetch branding config
  const brandingQuery = trpc.branding.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Fetch theme colors
  const themeQuery = trpc.branding.getTheme.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (themeQuery.data?.cssVariables) {
      const root = document.documentElement;
      Object.entries(themeQuery.data.cssVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [themeQuery.data]);

  // Update favicon when branding changes
  useEffect(() => {
    if (brandingQuery.data?.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (link) {
        link.href = brandingQuery.data.faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = brandingQuery.data.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [brandingQuery.data?.faviconUrl]);

  // Update document title with organization name
  useEffect(() => {
    if (brandingQuery.data?.organizationName) {
      const currentTitle = document.title;
      // Only update if not already including org name
      if (!currentTitle.includes(brandingQuery.data.organizationName)) {
        document.title = `${brandingQuery.data.organizationName} - Recording Studio Manager`;
      }
    }
  }, [brandingQuery.data?.organizationName]);

  const value = useMemo<BrandingContextValue>(() => ({
    branding: brandingQuery.data ?? (isAuthenticated ? DEFAULT_BRANDING : null),
    theme: themeQuery.data ?? null,
    isLoading: brandingQuery.isLoading || themeQuery.isLoading,
    error: brandingQuery.error ?? themeQuery.error ?? null,
    refetch: () => {
      brandingQuery.refetch();
      themeQuery.refetch();
    },
  }), [
    brandingQuery.data,
    brandingQuery.isLoading,
    brandingQuery.error,
    themeQuery.data,
    themeQuery.isLoading,
    themeQuery.error,
    isAuthenticated,
  ]);

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access branding context
 */
export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

/**
 * Hook to get just the logo URL
 */
export function useLogo(): string | null {
  const { branding } = useBranding();
  return branding?.logoUrl ?? null;
}

/**
 * Hook to get organization name
 */
export function useOrganizationName(): string {
  const { branding } = useBranding();
  return branding?.organizationName ?? 'Studio';
}

/**
 * Hook to get theme colors
 */
export function useThemeColors(): ThemeColors | null {
  const { theme } = useBranding();
  return theme?.colors ?? null;
}

/**
 * Hook for color preview (without saving)
 */
export function useColorPreview(
  primaryColor: string,
  secondaryColor: string,
  accentColor: string
) {
  return trpc.branding.previewTheme.useQuery(
    { primaryColor, secondaryColor, accentColor },
    {
      enabled: Boolean(primaryColor && secondaryColor && accentColor),
      staleTime: Infinity, // Preview doesn't need to be refetched
    }
  );
}
