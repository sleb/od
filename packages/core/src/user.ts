import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import z from "zod";
import { createCustomToken } from "./device";
import { auth } from "./firebase";

export const UserSchema = z.object({
  uid: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;

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

export const logInDevice = async (
  deviceId: string,
  authCode: string,
): Promise<void> => {
  try {
    const token = await createCustomToken(deviceId, authCode);
    await signInWithCustomToken(auth, token);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(
        `Error logging in device: ${err.message}, code: ${err.code}`,
      );
    }

    throw new Error(`Error logging in device: ${err}`);
  }
};

export const getCurrentUserId = (): string | undefined => {
  return auth.currentUser?.uid;
};
