import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import useAuthSession from "@/hooks/use-auth-session";
type GuestRouteProps = {
  children: ReactElement;
};

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { isAuthenticated } = useAuthSession();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
