import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth, firebaseReady } from "./firebase.js";

const GROUP_IDS = ["mild", "moderate", "neurodivergent", "other"];

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function renderMessage(msg) {
  const el = document.createElement("div");
  el.className = "chat-message";
  const when =
    msg.createdAt && typeof msg.createdAt.toDate === "function"
      ? msg.createdAt.toDate().toLocaleString()
      : "just now";
  el.innerHTML = `
    <div class="chat-message-head">
      <span class="chat-message-name">${escapeHtml(msg.name || "Anonymous parent")}</span>
      <span class="chat-message-time">${escapeHtml(when)}</span>
    </div>
    <p class="chat-message-body">${escapeHtml(msg.message)}</p>
  `;
  return el;
}

function messagesCollection(groupId) {
  return collection(db, "organizeEventsChats", groupId, "messages");
}

const listenedGroups = new Set();

function listenToGroup(groupId) {
  if (listenedGroups.has(groupId) || !firebaseReady) return;
  listenedGroups.add(groupId);

  const messagesEl = document.querySelector(
    `.chat-panel[data-group="${groupId}"] .chat-messages`
  );
  const q = query(messagesCollection(groupId), orderBy("createdAt", "asc"));

  onSnapshot(
    q,
    (snapshot) => {
      messagesEl.innerHTML = "";
      if (snapshot.empty) {
        messagesEl.innerHTML =
          '<p class="chat-empty">No messages yet — be the first to start the conversation!</p>';
        return;
      }
      snapshot.forEach((doc) => {
        messagesEl.appendChild(renderMessage(doc.data()));
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    },
    (err) => {
      console.error(err);
      messagesEl.innerHTML =
        '<p class="chat-empty">Couldn\'t load messages right now. Please try again later.</p>';
    }
  );
}

function showFirebaseNotReadyNotice() {
  document.querySelectorAll(".chat-messages").forEach((el) => {
    el.innerHTML =
      '<p class="chat-empty">Chat isn\'t connected yet — add your Firebase project keys to assets/js/firebase-config.js.</p>';
  });
}

document.querySelectorAll(".group-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".group-tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".chat-panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    const groupId = btn.dataset.group;
    document.querySelector(`.chat-panel[data-group="${groupId}"]`).classList.add("active");
    listenToGroup(groupId);
  });
});

document.querySelectorAll(".chat-form").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!firebaseReady) {
      alert(
        "Chat isn't connected yet — the site owner still needs to add their Firebase config."
      );
      return;
    }
    const user = auth && auth.currentUser;
    if (!user) {
      window.dispatchEvent(new CustomEvent("nyas-open-login"));
      return;
    }
    const groupId = form.dataset.group;
    const name = user.displayName || (user.email ? user.email.split("@")[0] : "Parent");
    const textarea = form.querySelector("textarea");
    const message = textarea.value.trim();
    if (!message) return;

    const submitBtn = form.querySelector("button");
    submitBtn.disabled = true;
    try {
      await addDoc(messagesCollection(groupId), {
        name,
        message,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
      textarea.value = "";
    } catch (err) {
      console.error(err);
      alert("Your message couldn't be sent. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });
});

function updateComposersForAuth(user) {
  document.querySelectorAll(".chat-composer").forEach((composer) => {
    const form = composer.querySelector(".chat-form");
    const prompt = composer.querySelector(".login-to-post-btn");
    if (!form || !prompt) return;
    if (user) {
      form.hidden = false;
      prompt.hidden = true;
    } else {
      form.hidden = true;
      prompt.hidden = false;
    }
  });
}

document.querySelectorAll(".login-to-post-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("nyas-open-login"));
  });
});

window.addEventListener("nyas-auth-changed", (e) => {
  updateComposersForAuth(e.detail.user);
});

updateComposersForAuth(auth && auth.currentUser);

if (firebaseReady) {
  listenToGroup(GROUP_IDS[0]);
} else {
  showFirebaseNotReadyNotice();
}
