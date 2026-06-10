import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { useEffect, useState } from 'react';
import { useUserQuery } from '../lib/queries';

export function ProtectedRoute() {
  const { isLoggedIn, login, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // We use this query to verify the session with the server.
  // It only runs once on mount if we're technically logged in from Zustand's perspective, 
  // or if we're not but want to check if the cookie is still valid.
  const { data: user, isLoading, isError } = useUserQuery(true);

  useEffect(() => {
    if (!isLoading) {
      if (user?.data) {
        login(user.data);
      } else if (isError || !user) {
        logout();
      }
      setIsChecking(false);
    }
  }, [user, isLoading, isError, login, logout]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-earth-dark flex items-center justify-center">
        <span className="text-wood font-mono text-sm tracking-widest uppercase">Loading...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/cms/login" replace />;
  }

  return <Outlet />;
}
