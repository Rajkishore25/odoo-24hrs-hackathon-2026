import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/loading-state';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingState message="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg font-semibold text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          Your role ({user.role}) does not have access to this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
