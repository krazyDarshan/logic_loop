import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAY707hjwUYi8CjUqAFQG6NQht83OFSVlA",
  authDomain: "skillnova-92f52.firebaseapp.com",
  projectId: "skillnova-92f52",
  storageBucket: "skillnova-92f52.firebasestorage.app",
  messagingSenderId: "795604572657",
  appId: "1:795604572657:web:daff388de722c9a4130c50",
  measurementId: "G-6R81X32W81"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
