import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { type User } from "./schemas";

export { UserSchema, type User } from "./schemas";

export const onAuthChange = (
  next: (user: User | null) => void,
  err: (error: Error) => void,
): Promise<void> => {
  onAuthStateChanged(
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

  return auth.authStateReady();
};

export const logInUser = async (email: string, password: string) => {
  try {
    const {
      user: { uid },
    } = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", uid);
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(
        `Firebase auth error: ${error.message}, code: ${error.code}`,
      );
    }

    throw new Error(`Error logging in: ${error}`);
  }
};
