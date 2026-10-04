// Shared Firebase app/auth/Firestore setup, used by every page.
// Only initializes once so auth.js and organize-events.js don't collide.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY"
);

export let db = null;
export let auth = null;

if (firebaseReady) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error("Firebase failed to initialize:", err);
  }
} else {
  console.warn(
    "Firebase config not set yet — fill in assets/js/firebase-config.js with your project's keys."
  );
}
