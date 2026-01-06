import { useEffect } from 'react';

/**
 * usePageTitle Hook
 *
 * Dynamically updates the document title based on the current page.
 * Automatically appends " - Recording Studio Manager" suffix.
 *
 * @param title - The page-specific title (e.g., "Dashboard", "My Bookings")
 * @param suffix - Optional custom suffix (default: "Recording Studio Manager")
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   usePageTitle('Dashboard');
 *   // Sets title to: "Dashboard - Recording Studio Manager"
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePageTitle(title: string, suffix = 'Recording Studio Manager') {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - ${suffix}` : suffix;

    // Cleanup: restore previous title on unmount
    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}
