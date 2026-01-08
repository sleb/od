import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthRequired from "./components/auth-required";
import DeviceDetailPage from "./components/devices/device-detail-page";
import DevicesListPage from "./components/devices/devices-list-page";
import HomePage from "./components/home/home-page";
import LandingPage from "./components/landing/landing-page";
import AppShell from "./components/layout/app-shell";
import LoginPage from "./components/login/login-page";
import SignUpPage from "./components/signup/signup-page";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignUpPage /> },
      {
        element: <AuthRequired />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "dashboard", element: <HomePage /> },
              { path: "devices", element: <DevicesListPage /> },
              { path: "devices/:deviceId", element: <DeviceDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" /> },
]);
