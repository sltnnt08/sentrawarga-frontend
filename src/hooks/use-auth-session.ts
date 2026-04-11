import { useEffect, useMemo, useState } from "react";
import { authStateEvent, getUser, isAuthenticated } from "@/lib/api";

const getInitialAuthSnapshot = () => ({
  isAuthenticated: isAuthenticated(),
  user: getUser(),
});

const useAuthSession = () => {
  const [authSnapshot, setAuthSnapshot] = useState(getInitialAuthSnapshot);

  useEffect(() => {
    const refresh = () => setAuthSnapshot(getInitialAuthSnapshot());

    window.addEventListener(authStateEvent, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(authStateEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return useMemo(
    () => ({
      isAuthenticated: authSnapshot.isAuthenticated,
      user: authSnapshot.user,
    }),
    [authSnapshot],
  );
};

export default useAuthSession;
