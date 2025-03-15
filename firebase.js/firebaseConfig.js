
// استيراد الدوال المطلوبة من Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyCsZLq-fPgfRDZwbosppEUYlK-NwODLbNE",
  authDomain: "rewardsads-aa9cb.firebaseapp.com",
  projectId: "rewardsads-aa9cb",
  storageBucket: "rewardsads-aa9cb.firebasestorage.app",
  messagingSenderId: "183667070936",
  appId: "1:183667070936:web:d23f73f20c0647bbe6c4ad"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
