import { UserContext } from "@/context/user-context";
import { useContext } from "react";

export const useUser = () => {
  const user = useContext(UserContext);

  if (!user) {
    throw new Error("User not authenticated");
  }

  return user;
};
