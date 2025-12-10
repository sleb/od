import type { User } from "@overdrip/core";
import { useContext } from "react";
import { UserContext } from "../context/user-context";

export const useUser = (): User => {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error(
      "useUser must be used within a UserProvider and the user must be authenticated",
    );
  }
  return user;
};
