import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: React.ReactNode;
  role?: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'ANY';
}

export function ProtectedRoute({ children, role = 'ANY' }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN')
    return <Navigate to="/admin/dashboard" replace />;

  if (role === 'CLINIC_ADMIN' && user.role !== 'CLINIC_ADMIN')
    return <Navigate to="/admin/dashboard" replace />;

  return <>{children}</>;
}
