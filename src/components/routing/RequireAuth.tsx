import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { accessToken, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
