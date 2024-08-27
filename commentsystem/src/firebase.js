// firebase.js
import { initializeApp } from 'firebase/app';
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA6GSEe_6_PJIbuvUFsYcShLbbUURBKRLU",
  authDomain: "comments-19425.firebaseapp.com",
  projectId: "comments-19425",
  storageBucket: "comments-19425.appspot.com",
  messagingSenderId: "50454310162",
  appId: "1:50454310162:web:c9c58b5634e054c66957cb",
  measurementId: "G-SL2T73RCJ5"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);