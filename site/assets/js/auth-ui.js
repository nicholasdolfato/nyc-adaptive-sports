// Shared login header button + modal, included on every page.

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, firebaseReady } from "./firebase.js";

const loginTrigger = document.getElementById("login-trigger");
const loginLabel = document.getElementById("login-label");
const loginAvatar = document.getElementById("login-avatar");
const modal = document.getElementById("auth-modal");
const closeBtn = document.getElementById("auth-modal-close");
const emailForm = document.getElementById("auth-email-form");
const nameField = document.getElementById("auth-name-field");
const nameInput = document.getElementById("auth-name");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const errorEl = document.getElementById("auth-error");
const submitBtn = document.getElementById("auth-submit-btn");
const toggleBtn = document.getElementById("auth-toggle-btn");
const toggleText = document.getElementById("auth-toggle-text");
const modalTitle = document.getElementById("auth-modal-title");
const googleBtn = document.getElementById("google-signin-btn");

let mode = "login";
let currentUser = null;

function openModal() {
  if (!modal) return;
  setMode("login");
  if (emailForm) emailForm.reset();
  if (errorEl) errorEl.hidden = true;
  modal.hidden = false;
}

function closeModal() {
  if (modal) modal.hidden = true;
}

function setMode(newMode) {
  mode = newMode;
  const isSignup = mode === "signup";
  if (nameField) nameField.hidden = !isSignup;
  if (nameInput) nameInput.required = isSignup;
  if (modalTitle) modalTitle.textContent = isSignup ? "Sign Up" : "Log In";
  if (submitBtn) submitBtn.textContent = isSignup ? "Sign Up" : "Log In";
  if (toggleText) toggleText.textContent = isSignup ? "Already have an account?" : "Don't have an account?";
  if (toggleBtn) toggleBtn.textContent = isSignup ? "Log In" : "Sign Up";
  if (errorEl) errorEl.hidden = true;
}

function showError(message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function friendlyAuthError(err) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with that email — try logging in instead.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
  };
  return map[err.code] || "Something went wrong. Please try again.";
}

function updateHeaderForUser(user) {
  currentUser = user;
  if (!loginLabel || !loginAvatar || !loginTrigger) return;
  if (user) {
    const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Account");
    loginLabel.textContent = displayName.split(" ")[0];
    loginAvatar.textContent = displayName.charAt(0).toUpperCase();
    loginTrigger.title = "Click to log out";
  } else {
    loginLabel.textContent = "Log In";
    loginAvatar.innerHTML = "&#128100;";
    loginTrigger.title = "Click to log in";
  }
}

if (loginTrigger) {
  loginTrigger.addEventListener("click", () => {
    if (currentUser) {
      signOut(auth);
    } else {
      openModal();
    }
  });
}

if (closeBtn) closeBtn.addEventListener("click", closeModal);
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));
}

if (emailForm) {
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!firebaseReady) {
      showError("Login isn't connected yet.");
      return;
    }
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    submitBtn.disabled = true;
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const name = nameInput.value.trim();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
          updateHeaderForUser(cred.user);
        }
      }
      closeModal();
    } catch (err) {
      showError(friendlyAuthError(err));
    } finally {
      submitBtn.disabled = false;
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    if (!firebaseReady) {
      showError("Login isn't connected yet.");
      return;
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      closeModal();
    } catch (err) {
      showError(friendlyAuthError(err));
    }
  });
}

window.addEventListener("nyas-open-login", openModal);

if (firebaseReady && auth) {
  onAuthStateChanged(auth, (user) => {
    updateHeaderForUser(user);
    window.dispatchEvent(new CustomEvent("nyas-auth-changed", { detail: { user } }));
  });
} else {
  updateHeaderForUser(null);
}
