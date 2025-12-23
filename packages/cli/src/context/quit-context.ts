import { createContext } from "react";

export const QuitContext = createContext({
  shouldQuit: false,
  quit: (): void => {
    throw new Error("QuitContext.quit() not implemented");
  },
});
