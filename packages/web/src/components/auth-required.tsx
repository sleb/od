import Loading from "@/components/loading";
import { UserContext } from "@/context/user-context";
import { useAuthState } from "@/hooks/auth-state";
import { authReady } from "@overdrip/core/auth";
import { use } from "react";
import { Navigate, Outlet } from "react-router-dom";

const AuthRequired = () => {
  use(authReady);
  const [user, loading, error] = useAuthState();

  if (error) {
    throw new Error(`AuthState error: ${error}`);
  }

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <UserContext value={user}>
      <Outlet />
    </UserContext>
  );
};

export default AuthRequired;
