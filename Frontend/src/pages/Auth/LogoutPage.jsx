import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }

    navigate('/login', { replace: true });
  }, [isAuthenticated, logout, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
        <h2 className="text-lg font-semibold text-slate-800">Signing you out</h2>
        <p className="mt-2 text-sm text-slate-600">Please wait a moment.</p>
      </div>
    </div>
  );
};

export default LogoutPage;
