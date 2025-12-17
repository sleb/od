import { useContext } from "react";
import { QuitContext } from "../context/quit-context";

export const useQuit = () => {
  const { quit } = useContext(QuitContext);
  return quit;
};

export const useShouldQuit = () => {
  const { shouldQuit } = useContext(QuitContext);
  return shouldQuit;
};
