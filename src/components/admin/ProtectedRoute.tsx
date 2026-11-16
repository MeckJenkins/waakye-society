import { Link, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/useAdminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { status, errorMessage } = useAdminAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-pepper" aria-hidden="true" />
        <span className="sr-only">Checking administrator access...</span>
      </div>
    );
  }

  if (status === 'signedOut') {
    return <Navigate to="/admin/login" replace />;
  }

  if (status !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-waakye-dark">Admin access unavailable</h1>
          <p className="mt-3 text-gray-600" role="alert">
            {errorMessage ?? 'This account does not have administrator access.'}
          </p>
          <Link
            to="/admin/login"
            className="mt-6 inline-block rounded-lg bg-pepper px-5 py-3 font-semibold text-white hover:bg-pepper-light"
          >
            Return to admin login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;