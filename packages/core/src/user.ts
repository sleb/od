import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export const logInUser = async (email: string, password: string) => {
  try {
    const {
      user: { uid },
    } = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", uid);
    return uid;
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(
        `Firebase auth error: ${error.message}, code: ${error.code}`,
      );
    }

    throw new Error(`Error logging in: ${error}`);
  }
};

export const signUpUser = async (email: string, password: string) => {
  try {
    const {
      user: { uid },
    } = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created:", uid);
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(
        `Firebase auth error: ${error.message}, code: ${error.code}`,
      );
    }

    throw new Error(`Error creating account: ${error}`);
  }
};
