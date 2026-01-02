import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import type { User } from "./schemas";

export const onAuthChange = (
  next: (user: User | null) => void,
  err: (error: Error) => void,
): (() => void) => {
  return onAuthStateChanged(
    auth,
    (firebaseUser) => {
      if (firebaseUser) {
        next({ uid: firebaseUser.uid });
      } else {
        next(null);
      }
    },
    err,
  );
};

export const logOut = () => {
  signOut(auth).catch(console.error);
};

export const authReady: Promise<void> = auth.authStateReady();
