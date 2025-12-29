import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data: authUser, isLoading } = trpc.auth.me.useQuery();

  // Check if user is superadmin
  const SUPERADMIN_EMAIL = 'admin@recording-studio-manager.com';
  const envEmail = import.meta.env.VITE_SUPERADMIN_EMAIL as string || SUPERADMIN_EMAIL;
  const userEmail = authUser?.user?.email;
  const isSuperAdmin = userEmail === envEmail;

  // Debug logging
  console.log('[SuperAdminRoute] Auth check:', {
    userEmail,
    envEmail,
    SUPERADMIN_EMAIL,
    isSuperAdmin,
    isLoading,
    authUser: authUser ? 'loaded' : 'not loaded'
  });

  useEffect(() => {
    if (!isLoading && authUser && !isSuperAdmin) {
      console.log('[SuperAdminRoute] Access denied, redirecting...');
      toast.error("Accès refusé - Superadmin uniquement");
      navigate("/dashboard");
    }
  }, [authUser, isSuperAdmin, navigate, isLoading]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
