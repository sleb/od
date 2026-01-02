import type { User } from "@overdrip/core/schemas";
import { createContext } from "react";

export const UserContext = createContext<User | null>(null);
