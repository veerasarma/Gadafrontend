import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyRole } from '@/lib/roles';

export function RequireRole({ roles, children }:{
  roles: string[]; children: JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  const ok = user && hasAnyRole(user, roles);
  if (!ok) return <Navigate to="/" replace state={{ from: location }} />;

  return children;
}
