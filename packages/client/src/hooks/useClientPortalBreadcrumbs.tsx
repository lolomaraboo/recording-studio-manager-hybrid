import { useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, FolderOpen, CreditCard, User } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

/**
 * Generate breadcrumbs for Client Portal routes
 *
 * Maps route paths to user-friendly labels with icons
 * Always includes Home as first breadcrumb
 */
export function useClientPortalBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Route label mapping
  const routeLabels: Record<string, { label: string; icon?: React.ReactNode }> = {
    'client-portal': { label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    bookings: { label: 'My Bookings', icon: <Calendar className="h-4 w-4" /> },
    invoices: { label: 'Invoices', icon: <FileText className="h-4 w-4" /> },
    projects: { label: 'Projects', icon: <FolderOpen className="h-4 w-4" /> },
    payments: { label: 'Payment History', icon: <CreditCard className="h-4 w-4" /> },
    profile: { label: 'Profile', icon: <User className="h-4 w-4" /> },
  };

  const breadcrumbs: BreadcrumbItem[] = [];

  // Build breadcrumb path
  let currentPath = '';
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;

    // Get label for this segment
    const routeInfo = routeLabels[segment];
    if (routeInfo) {
      breadcrumbs.push({
        label: routeInfo.label,
        href: currentPath,
        icon: routeInfo.icon,
      });
    } else {
      // Fallback: capitalize segment
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}
