import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthRequired from "./components/auth-required";
import HomePage from "./components/home/home-page";
import AppShell from "./components/layout/app-shell";
import LoginPage from "./components/login/login-page";
import SignUpPage from "./components/signup/signup-page";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignUpPage /> },
      {
        element: <AuthRequired />,
        children: [
          {
            element: <AppShell />,
            children: [{ index: true, element: <HomePage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" /> },
]);
