import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthRequired from "./components/auth-required";
import HomePage from "./components/home/home-page";
import LoginPage from "./components/login/login-page";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { path: "login", element: <LoginPage /> },
      {
        element: <AuthRequired />,
        children: [{ index: true, element: <HomePage /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" /> },
]);
