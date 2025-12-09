import { createContext } from "react";

export const QuitContext = createContext({
  shouldQuit: false,
  quit: () => { },
});