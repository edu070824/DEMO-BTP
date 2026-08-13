import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();

  return isAdmin ? children : <Navigate to="/" replace />;
}

function PublicOnly({ children }) {
  const { isAdmin, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  return children;
}

export { PublicOnly, RequireAdmin, RequireAuth };
