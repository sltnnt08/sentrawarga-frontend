import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuthSession from "@/hooks/use-auth-session";

type AdminRouteProps = {
  children: ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user } = useAuthSession();

  if (!isAuthenticated) {
    return <Navigate to="/masuk" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
