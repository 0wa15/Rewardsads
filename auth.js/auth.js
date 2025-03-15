
// استيراد الدوال المطلوبة من Firebase
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig"; // مسار ملف الإعدادات

// تسجيل مستخدم جديد
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("تم إنشاء الحساب:", userCredential.user);
  } catch (error) {
    console.error("خطأ أثناء التسجيل:", error.message);
  }
};

// تسجيل الدخول
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("تم تسجيل الدخول:", userCredential.user);
  } catch (error) {
    console.error("خطأ أثناء تسجيل الدخول:", error.message);
  }
};
