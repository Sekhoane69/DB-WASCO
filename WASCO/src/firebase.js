import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABkW08HW-0zxTYTUlWduUTnVHKuGYsZ6o",
  authDomain: "wasco-project.firebaseapp.com",
  projectId: "wasco-project",
  storageBucket: "wasco-project.firebasestorage.app",
  messagingSenderId: "831326114224",
  appId: "1:831326114224:web:f93d031752fcf0cd6a4675",
  measurementId: "G-YJR9E90V83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
