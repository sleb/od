import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

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
