import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from './LoadingSkeleton';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const location = useLocation();

  if (!_hasHydrated) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
