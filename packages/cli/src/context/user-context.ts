import type { User } from "@overdrip/core";
import { createContext } from "react";

export const UserContext = createContext<User | null>(null);