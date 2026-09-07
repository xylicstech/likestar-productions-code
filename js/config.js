// ============================================================
// LIKESTAR PUBLIC WEBSITE
// Firebase Configuration
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

// ------------------------------------------------------------
// Firebase project configuration
// ------------------------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyD0I7dUHN7VqckxjlO6lM4RXtYN411k2I",
    authDomain: "likestar-web.firebaseapp.com",
    projectId: "likestar-web",
    storageBucket: "likestar-web.firebasestorage.app",
    messagingSenderId: "371573025114",
    appId: "1:371573025114:web:31c910a8e39461e29e2b63",
    measurementId: "G-0MVMHQE6KL"
};

// ------------------------------------------------------------
// Initialize Firebase
// ------------------------------------------------------------

const app = initializeApp(firebaseConfig);

// ------------------------------------------------------------
// Firebase Authentication
// ------------------------------------------------------------

const auth = getAuth(app);

// ------------------------------------------------------------
// Cloud Firestore
// ------------------------------------------------------------

const db = getFirestore(app);

// ------------------------------------------------------------
// Google Analytics
// ------------------------------------------------------------

let analytics = null;

try {
    if (await isSupported()) {
        analytics = getAnalytics(app);
    }
} catch (error) {
    console.warn("Firebase Analytics unavailable:", error);
}

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

export {
    app,
    auth,
    db,
    analytics,
    firebaseConfig
};