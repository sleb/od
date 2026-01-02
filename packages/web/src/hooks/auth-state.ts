import { onAuthChange } from "@overdrip/core/auth";
import type { User } from "@overdrip/core/schemas";
import { useEffect } from "react";
import { useLoadingValue } from "./loading-value";

export const useAuthState = (): [User | null, boolean, Error | null] => {
  const {
    error,
    loading,
    value: user,
    setError,
    setValue: setUser,
  } = useLoadingValue<User>();

  useEffect(() => {
    return onAuthChange(setUser, setError);
  }, [setError, setUser]);

  return [user, loading, error];
};
