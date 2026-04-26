import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrin6KThIEIp8REDIpnNcNu0yUGqIumdY",
  authDomain: "onlycats-a76c5.firebaseapp.com",
  projectId: "onlycats-a76c5",
  storageBucket: "onlycats-a76c5.firebasestorage.app",
  messagingSenderId: "825767016517",
  appId: "1:825767016517:web:b89e7a7301a90c11fbcb2c"
};

// Ініціалізуємо Firebase
const app = initializeApp(firebaseConfig);

// Експортуємо базу даних (для текстів і лайків) та сховище (для фото)
export const db = getFirestore(app);
export const storage = getStorage(app);