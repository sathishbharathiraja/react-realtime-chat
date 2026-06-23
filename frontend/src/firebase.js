import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDssdpQddpiZZpXgbu4-E9WZAlcHeW3kmI",
  authDomain: "realtime-chat-86476.firebaseapp.com",
  projectId: "realtime-chat-86476",
  storageBucket: "realtime-chat-86476.firebasestorage.app",
  messagingSenderId: "965273604934",
  appId: "1:965273604934:web:a5051b87efcb5acdf4cb47",
  measurementId: "G-N0EZC0SVYD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
