import admin from "firebase-admin";

export const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp();
