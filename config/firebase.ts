import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2rWTDIF2Y9xfT-BH5SsQ6sjTJ-LNNE-E",
  authDomain: "webintosh-chat.firebaseapp.com",
  projectId: "webintosh-chat",
  storageBucket: "webintosh-chat.firebasestorage.app",
  messagingSenderId: "921735878847",
  appId: "1:921735878847:web:faebe9d4a8b53ef0a44e0a",
  measurementId: "G-3C2N0XP48K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
