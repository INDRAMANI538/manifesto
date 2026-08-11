// ============================================
// MANIFESTO — Firebase Configuration
// Initialize Firebase App, Auth, and Firestore
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDaAwVWpr5GECYuHboEEzZWIrlQS5aK2JE",
  authDomain: "manifesto-5b132.firebaseapp.com",
  projectId: "manifesto-5b132",
  storageBucket: "manifesto-5b132.firebasestorage.app",
  messagingSenderId: "251276990671",
  appId: "1:251276990671:web:2632010812e46c76287fba"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
