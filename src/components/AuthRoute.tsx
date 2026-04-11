import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuthSession from "@/hooks/use-auth-session";

type AuthRouteProps = {
  children: ReactNode;
};

const AuthRoute = ({ children }: AuthRouteProps) => {
  const { isAuthenticated } = useAuthSession();

  if (!isAuthenticated) {
    return <Navigate to="/masuk" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
