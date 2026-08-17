import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

// Maps each user role to their dedicated portal route
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: '/admin',
  customer: '/portal',
  hotel: '/partner/hotel',
  restaurant: '/partner/restaurant',
  driver: '/partner/driver',
  guide: '/partner/guide',
};

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // 1. Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <div className="w-8 h-8 border-4 border-cocoa-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated users -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. If explicit roles are specified (e.g., roles=['admin']) and user doesn't match:
  if (roles && role && !roles.includes(role)) {
    const userDashboard = ROLE_DASHBOARDS[role] || '/portal';
    return <Navigate to={userDashboard} replace />;
  }

  // 4. Default Portal Catch: If user accesses /portal but is an ADMIN or PARTNER,
  // redirect them to their respective dashboard instead of showing the customer portal!
  if (!roles && role && role !== 'customer') {
    const userDashboard = ROLE_DASHBOARDS[role] || '/admin';
    return <Navigate to={userDashboard} replace />;
  }

  return <>{children}</>;
}