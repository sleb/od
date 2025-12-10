import { useContext, type ReactNode } from "react";
import { UserContext } from "../context/user-context";
import LoginForm from "./login-form";

type Props = { children: ReactNode };
const AuthRequired = ({ children }: Props) => {
  const user = useContext(UserContext);
  if (!user) {
    return <LoginForm />;
  }

  return children;
};

export default AuthRequired;
