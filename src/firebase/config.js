import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCWTxLIqaL9yo3fWHL-zzyevrq2X-HZirE",
  authDomain: "chat-app-ec3cd.firebaseapp.com",
  projectId: "chat-app-ec3cd",
  storageBucket: "chat-app-ec3cd.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "385754759515",
  appId: "1:385754759515:web:5b7bacde2c49b42f295a7e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;