import { getFirestore, terminate } from "firebase/firestore";

export const terminateDb = async () => {
  await terminate(getFirestore());
};
