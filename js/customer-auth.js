
// ============================================================
// LIKESTAR PUBLIC WEBSITE
// Customer Authentication
//
// Authentication:
//   Google ONLY
//
// Responsibilities:
//   - Google sign-in / sign-up
//   - Create customer profile for first-time users
//   - Restore authenticated sessions
//   - Protect customer pages
//   - Logout
//
// SECURITY MODEL:
//   - Firebase Authentication is the identity authority.
//   - Firebase UID is the users/{uid} document ID.
//   - No passwords are handled or stored.
//   - No authentication state is stored in localStorage.
//   - Frontend checks are NOT the security boundary.
//   - Firestore Security Rules MUST enforce authorization.
// ============================================================

import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    auth,
    db
} from "./config.js";

// ============================================================
// CONFIGURATION
// ============================================================

const CUSTOMER_CONFIG = Object.freeze({
    loginPage: "customer-login.html",
    dashboardPage: "customer-dashboard.html",

    // This value MUST match the Firestore Security Rules.
    customerRole: "customer"
});

// ============================================================
// GOOGLE AUTH PROVIDER
// ============================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});

// ============================================================
// INTERNAL STATE
// ============================================================

let currentUser = null;
let authInitialized = false;
let authStatePromise = null;

// ============================================================
// PAGE HELPERS
// ============================================================

function isCustomerLoginPage() {
    return window.location.pathname.endsWith(
        CUSTOMER_CONFIG.loginPage
    );
}

function isCustomerDashboardPage() {
    return window.location.pathname.endsWith(
        CUSTOMER_CONFIG.dashboardPage
    );
}

function redirectToLogin() {
    if (!isCustomerLoginPage()) {
        window.location.replace(
            CUSTOMER_CONFIG.loginPage
        );
    }
}

function redirectToDashboard() {
    if (!isCustomerDashboardPage()) {
        window.location.replace(
            CUSTOMER_CONFIG.dashboardPage
        );
    }
}

// ============================================================
// FIREBASE ERROR HANDLING
// ============================================================

function getFirebaseErrorMessage(error) {
    if (!error) {
        return "Something went wrong. Please try again.";
    }

    switch (error.code) {

        case "auth/popup-closed-by-user":
            return "The Google sign-in window was closed.";

        case "auth/popup-blocked":
            return "Your browser blocked the Google sign-in window. Please allow pop-ups for LikeStar and try again.";

        case "auth/cancelled-popup-request":
            return "Another Google sign-in request is already in progress.";

        case "auth/network-request-failed":
            return "A network error occurred. Check your internet connection and try again.";

        case "auth/too-many-requests":
            return "Too many sign-in attempts were made. Please wait a moment and try again.";

        case "auth/unauthorized-domain":
            return "This website domain is not authorized in Firebase Authentication.";

        case "auth/operation-not-allowed":
            return "Google sign-in is not enabled in Firebase Authentication.";

        case "auth/account-exists-with-different-credential":
            return "This Google account is already associated with a different sign-in method.";

        case "auth/user-disabled":
            return "This account has been disabled. Please contact LikeStar.";

        case "auth/user-token-expired":
            return "Your session has expired. Please sign in again.";

        case "auth/invalid-user-token":
            return "Your authentication session is no longer valid. Please sign in again.";

        case "auth/web-storage-unsupported":
            return "Your browser does not support the storage required for authentication.";

        case "auth/internal-error":
            return "Google sign-in encountered an internal error. Please try again.";

        default:
            console.error(
                "Firebase authentication error:",
                error
            );

            return "We could not complete Google sign-in. Please try again.";
    }
}

// ============================================================
// GOOGLE PROVIDER VALIDATION
// ============================================================
//
// Firebase Authentication already authenticated the user.
// This is an additional application-level check.
//
// Firestore Rules remain the actual security boundary.
// ============================================================

function isGoogleAuthenticatedUser(user) {
    if (!user) {
        return false;
    }

    const providerData = Array.isArray(user.providerData)
        ? user.providerData
        : [];

    return providerData.some(
        (provider) =>
            provider.providerId === "google.com"
    );
}

// ============================================================
// GET CUSTOMER PROFILE
// ============================================================

async function getCustomerProfile(uid) {
    if (!uid) {
        return null;
    }

    const userRef = doc(
        db,
        "users",
        uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

// ============================================================
// CREATE NEW CUSTOMER PROFILE
// ============================================================
//
// IMPORTANT:
//
// This function is ONLY called after Firebase Authentication
// has successfully authenticated the Google account.
//
// The document ID is always auth.uid.
//
// A customer cannot choose:
//   - their UID
//   - their role
//   - another user's UID
//
// Firestore Rules MUST enforce the same restrictions.
// ============================================================

async function createCustomerProfile(user) {
    if (!user?.uid) {
        throw new Error(
            "Cannot create customer profile without a Firebase UID."
        );
    }

    if (!isGoogleAuthenticatedUser(user)) {
        throw new Error(
            "Only Google-authenticated users can create customer accounts."
        );
    }

    const userRef = doc(
        db,
        "users",
        user.uid
    );

    const existingSnapshot = await getDoc(
        userRef
    );

    // --------------------------------------------------------
    // Race-condition protection
    // --------------------------------------------------------
    //
    // Another tab/request may have created the profile between
    // authentication and this call.
    //
    // If it exists now, do not overwrite it.
    // --------------------------------------------------------

    if (existingSnapshot.exists()) {
        return {
            created: false,
            profile: {
                id: existingSnapshot.id,
                ...existingSnapshot.data()
            }
        };
    }

    const customerProfile = {
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",

        role: CUSTOMER_CONFIG.customerRole,

        phone: "",
        businessName: "",

        active: true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(
        userRef,
        customerProfile
    );

    return {
        created: true,
        profile: {
            id: user.uid,
            ...customerProfile
        }
    };
}

// ============================================================
// SYNC GOOGLE IDENTITY FIELDS
// ============================================================
//
// Only Firebase identity information is synchronized.
//
// We NEVER overwrite:
//   - role
//   - active
//   - phone
//   - businessName
//
// Those fields belong to application/profile management.
// ============================================================

async function syncCustomerIdentity(user) {
    if (!user?.uid) {
        throw new Error(
            "Cannot synchronize a user without a Firebase UID."
        );
    }

    const userRef = doc(
        db,
        "users",
        user.uid
    );

    await setDoc(
        userRef,
        {
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            updatedAt: serverTimestamp()
        },
        {
            merge: true
        }
    );
}

// ============================================================
// ENSURE CUSTOMER ACCOUNT
// ============================================================
//
// Flow:
//
// Google authentication
//       ↓
// Firebase UID
//       ↓
// users/{uid}
//       ↓
// Does profile exist?
//       ├── NO  → create customer profile
//       └── YES → validate existing profile
//
// ============================================================

async function ensureCustomerAccount(user) {
    if (!user?.uid) {
        return {
            allowed: false,
            reason: "missing_uid",
            profile: null
        };
    }

    if (!isGoogleAuthenticatedUser(user)) {
        return {
            allowed: false,
            reason: "not_google_authenticated",
            profile: null
        };
    }

    let profile = await getCustomerProfile(
        user.uid
    );

    // --------------------------------------------------------
    // First Google login
    // --------------------------------------------------------

    if (!profile) {
        const result =
            await createCustomerProfile(user);

        profile = result.profile;

        // If the profile existed because of a race condition,
        // use its actual stored data.
        if (!profile) {
            profile = await getCustomerProfile(
                user.uid
            );
        }
    }

    if (!profile) {
        return {
            allowed: false,
            reason: "profile_creation_failed",
            profile: null
        };
    }

    // --------------------------------------------------------
    // Validate role
    // --------------------------------------------------------

    if (
        profile.role !==
        CUSTOMER_CONFIG.customerRole
    ) {
        console.warn(
            "Authenticated account does not have the customer role."
        );

        return {
            allowed: false,
            reason: "invalid_role",
            profile
        };
    }

    // --------------------------------------------------------
    // Validate active status
    // --------------------------------------------------------

    if (profile.active === false) {
        console.warn(
            "Customer account is inactive."
        );

        return {
            allowed: false,
            reason: "account_inactive",
            profile
        };
    }

    // --------------------------------------------------------
    // Synchronize Firebase identity information
    // --------------------------------------------------------

    await syncCustomerIdentity(user);

    return {
        allowed: true,
        reason: "customer_verified",
        profile
    };
}

// ============================================================
// GOOGLE SIGN-IN
// ============================================================

async function signInWithGoogle() {
    if (!auth || !db) {
        showAuthError(
            "LikeStar authentication is currently unavailable."
        );

        return null;
    }

    try {
        clearAuthError();
        setAuthLoadingState(true);

        const result =
            await signInWithPopup(
                auth,
                googleProvider
            );

        const user = result?.user;

        if (!user?.uid) {
            throw new Error(
                "Firebase did not return a valid authenticated user."
            );
        }

        const account =
            await ensureCustomerAccount(user);

        if (!account.allowed) {

            await signOut(auth);

            if (
                account.reason ===
                "account_inactive"
            ) {
                throw new Error(
                    "This LikeStar customer account is inactive."
                );
            }

            if (
                account.reason ===
                "invalid_role"
            ) {
                throw new Error(
                    "This account is not registered as a LikeStar customer."
                );
            }

            throw new Error(
                "This account could not be verified as a LikeStar customer."
            );
        }

        currentUser = user;

        redirectToDashboard();

        return user;

    } catch (error) {

        console.error(
            "Google sign-in failed:",
            error
        );

        showAuthError(
            error.code
                ? getFirebaseErrorMessage(error)
                : error.message ||
                  "We could not complete Google sign-in. Please try again."
        );

        return null;

    } finally {
        setAuthLoadingState(false);
    }
}

// ============================================================
// GOOGLE REDIRECT SIGN-IN
// ============================================================
//
// This can be used when popup authentication is unavailable.
// ============================================================

async function signInWithGoogleRedirect() {
    try {
        clearAuthError();
        setAuthLoadingState(true);

        await signInWithRedirect(
            auth,
            googleProvider
        );

    } catch (error) {

        console.error(
            "Google redirect sign-in failed:",
            error
        );

        showAuthError(
            getFirebaseErrorMessage(error)
        );

        setAuthLoadingState(false);
    }
}

// ============================================================
// PROCESS REDIRECT RESULT
// ============================================================

async function processRedirectResult() {
    try {

        const result =
            await getRedirectResult(auth);

        if (!result?.user) {
            return null;
        }

        const user = result.user;

        const account =
            await ensureCustomerAccount(user);

        if (!account.allowed) {

            await signOut(auth);

            throw new Error(
                "This account could not be verified as a LikeStar customer."
            );
        }

        currentUser = user;

        redirectToDashboard();

        return user;

    } catch (error) {

        console.error(
            "Google redirect result failed:",
            error
        );

        showAuthError(
            error.code
                ? getFirebaseErrorMessage(error)
                : error.message ||
                  "We could not complete Google sign-in."
        );

        return null;
    }
}

// ============================================================
// LOGOUT
// ============================================================

async function logoutCustomer() {
    try {

        await signOut(auth);

        currentUser = null;

        window.location.replace(
            CUSTOMER_CONFIG.loginPage
        );

    } catch (error) {

        console.error(
            "Customer logout failed:",
            error
        );

        showAuthError(
            "We could not sign you out. Please try again."
        );
    }
}

// ============================================================
// AUTH STATE INITIALIZATION
// ============================================================
//
// Firebase Auth automatically restores the user's session.
//
// We DO NOT use:
//   localStorage
//   sessionStorage
//   cookies created by our JavaScript
//
// to decide whether the user is authenticated.
// ============================================================

function initializeAuthState() {

    if (authStatePromise) {
        return authStatePromise;
    }

    authStatePromise =
        new Promise((resolve) => {

            let resolved = false;

            onAuthStateChanged(
                auth,
                async (user) => {

                    try {

                        if (user) {

                            currentUser = user;

                            const account =
                                await ensureCustomerAccount(
                                    user
                                );

                            if (!account.allowed) {

                                currentUser = null;

                                await signOut(
                                    auth
                                );

                                if (
                                    isCustomerDashboardPage()
                                ) {
                                    redirectToLogin();
                                }

                                resolve(null);
                                return;
                            }

                            // Authenticated customer is visiting
                            // the login page.
                            if (
                                isCustomerLoginPage()
                            ) {
                                redirectToDashboard();
                            }

                        } else {

                            currentUser = null;

                            // Dashboard requires authentication.
                            if (
                                isCustomerDashboardPage()
                            ) {
                                redirectToLogin();
                            }
                        }

                        resolve(currentUser);

                    } catch (error) {

                        console.error(
                            "Authentication state handling failed:",
                            error
                        );

                        currentUser = null;

                        if (
                            isCustomerDashboardPage()
                        ) {
                            redirectToLogin();
                        }

                        resolve(null);

                    } finally {

                        authInitialized = true;

                        document.dispatchEvent(
                            new CustomEvent(
                                "likestar-auth-ready",
                                {
                                    detail: {
                                        user:
                                            currentUser
                                    }
                                }
                            )
                        );
                    }
                }
            );
        });

    return authStatePromise;
}

// ============================================================
// WAIT FOR AUTHENTICATION INITIALIZATION
// ============================================================

async function waitForAuth() {
    if (authInitialized) {
        return currentUser;
    }

    return initializeAuthState();
}

// ============================================================
// UI: LOADING STATE
// ============================================================

function setAuthLoadingState(isLoading) {

    const buttons =
        document.querySelectorAll(
            "[data-google-signin]"
        );

    buttons.forEach((button) => {

        if (!button.dataset.originalText) {
            button.dataset.originalText =
                button.textContent.trim();
        }

        button.disabled = isLoading;

        if (isLoading) {

            button.setAttribute(
                "aria-busy",
                "true"
            );

            button.textContent =
                "Connecting to Google...";

        } else {

            button.removeAttribute(
                "aria-busy"
            );

            button.textContent =
                button.dataset.originalText;
        }
    });
}

// ============================================================
// UI: ERROR
// ============================================================

function showAuthError(message) {

    const errorElement =
        document.getElementById(
            "authError"
        );

    if (!errorElement) {
        return;
    }

    errorElement.textContent =
        message ||
        "Something went wrong.";

    errorElement.hidden = false;
}

function clearAuthError() {

    const errorElement =
        document.getElementById(
            "authError"
        );

    if (!errorElement) {
        return;
    }

    errorElement.textContent = "";
    errorElement.hidden = true;
}

// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {
    return currentUser;
}

// ============================================================
// PUBLIC API
// ============================================================

export {
    signInWithGoogle,
    signInWithGoogleRedirect,
    processRedirectResult,
    logoutCustomer,
    getCustomerProfile,
    createCustomerProfile,
    syncCustomerIdentity,
    ensureCustomerAccount,
    initializeAuthState,
    waitForAuth,
    getCurrentUser,
    clearAuthError
};

// ============================================================
// PAGE INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // ----------------------------------------------------
        // Google sign-in buttons
        // ----------------------------------------------------

        document
            .querySelectorAll(
                "[data-google-signin]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        await signInWithGoogle();
                    }
                );
            });

        // ----------------------------------------------------
        // Logout buttons
        // ----------------------------------------------------

        document
            .querySelectorAll(
                "[data-customer-logout]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        await logoutCustomer();
                    }
                );
            });

        // ----------------------------------------------------
        // Start authentication monitoring
        // ----------------------------------------------------

        initializeAuthState();

        // ----------------------------------------------------
        // Process Google redirect authentication
        // ----------------------------------------------------

        await processRedirectResult();
    }
);

