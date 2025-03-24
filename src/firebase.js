// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBsaVFThJrECQ6-C_L1TZyw4_AJu1AlbLU",
    authDomain: "pointsalesystem.firebaseapp.com",
    databaseURL: "https://pointsalesystem-default-rtdb.firebaseio.com",
    projectId: "pointsalesystem",
    storageBucket: "pointsalesystem.firebasestorage.app",
    messagingSenderId: "709765187774",
    appId: "1:709765187774:web:4860efb628d1ed1585f6ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const db = getFirestore(app);