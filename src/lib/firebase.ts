import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAk2XPu3pFbT9IsQkUR3_l6_Jxxn1linrg",
  authDomain: "nutrisight-ai-b34da.firebaseapp.com",
  projectId: "nutrisight-ai-b34da",
  storageBucket: "nutrisight-ai-b34da.firebasestorage.app",
  messagingSenderId: "867647264362",
  appId: "1:867647264362:web:74a002172099f60d245c13",
  measurementId: "G-LJFRGZTBHF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
