import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDQVev1zikFVuwFXArnumi45sp5hNgoKt0",
    authDomain: "dekaiah-dash-f648e.firebaseapp.com",
    projectId: "dekaiah-dash-f648e",
    storageBucket: "dekaiah-dash-f648e.firebasestorage.app",
    messagingSenderId: "231212372020",
    appId: "1:231212372020:web:441bb3f5af21bae1173a61",
    measurementId: "G-B57HCN04ZM"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
