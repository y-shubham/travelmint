// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "travelmint-app.firebaseapp.com",
  projectId: "travelmint-app",
  storageBucket: "travelmint-app.firebasestorage.app",
  messagingSenderId: "595405273700",
  appId: "1:595405273700:web:0bcff480cba587fac07d71",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
