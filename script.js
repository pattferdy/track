// ✅ Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getDatabase, ref, child, get, set } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0KEuTX22TijLqgDdeS_kxyrzIZs9kc8E",
  authDomain: "budgeting-id.firebaseapp.com",
  projectId: "budgeting-id",
  storageBucket: "budgeting-id.firebasestorage.app",
  messagingSenderId: "710126347620",
  appId: "1:710126347620:web:e2e4f2f5c7a489d6d78671",
  measurementId: "G-9EXTLK9LCD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

window.db = db;
window.get = get;
window.ref = ref;
window.child = child;
window.set = set;

let currentUser = null;

function loadProfilePic() {
  if (!currentUser) return;
  get(child(ref(db), `users/${currentUser}/profilePic`))
    .then(snap => {
      if (snap.exists()) {
        document.getElementById('profile-pic').src = snap.val();
      }
    })
    .catch(err => console.error("Profile pic error:", err));
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value.trim().toLowerCase();
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.remove('hidden');

  try {
    const userSnap = await get(child(ref(db), `users/${username}/password`));
    if (!userSnap.exists() || userSnap.val() !== password) {
      overlay.classList.add('hidden');
      alert("Invalid username or password.");
      return;
    }
    currentUser = username;
    localStorage.setItem('loggedInUser', username);
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');
    await loadBankData();
    updateTotalBalance();
    loadProfilePic();
    updateGainDisplay();
  } catch (error) {
    console.error("Login error:", error);
    alert("Error logging in.");
  } finally {
    overlay.classList.add('hidden');
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const savedUser = localStorage.getItem('loggedInUser');
  if (savedUser) {
    try {
      const userSnap = await get(child(ref(db), `users/${savedUser}/password`));
      if (userSnap.exists()) {
        currentUser = savedUser;
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('homepage').classList.remove('hidden');
        await loadBankData();
        updateTotalBalance();
        loadProfilePic();
        updateGainDisplay();
      } else {
        localStorage.removeItem('loggedInUser');
      }
    } catch (err) {
      console.error("Auto-login failed:", err);
      localStorage.removeItem('loggedInUser');
    }
  }
  const loginBtn = document.querySelector('.btn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  const amountInput = document.getElementById('amount');
  if (amountInput) {
    amountInput.addEventListener('input', () => {
      let rawValue = amountInput.value.replace(/,/g, '');
      if (!isNaN(rawValue) && rawValue !== '') {
        amountInput.value = parseFloat(rawValue).toLocaleString('en-US');
      }
    });
  }
  const profileInput = document.getElementById('profile-upload');
  if (profileInput) {
    profileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file || !currentUser) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const base64Image = e.target.result;
        document.getElementById('profile-pic').src = base64Image;
        set(ref(db, `users/${currentUser}/profilePic`), base64Image);
      };
      reader.readAsDataURL(file);
    });
  }
});

function openForm(type) {
  const formPage = document.getElementById('form-page');
  const formBox = formPage.querySelector('.form-box');
  document.getElementById('homepage').classList.add('hidden');
  formPage.classList.remove('hidden');
  formPage.dataset.type = type;
  formBox.innerHTML = '';
  if (type === 'benchmark') {
    formBox.innerHTML = `
      <p style="text-align:center; font-weight:bold;">Set current total as benchmark?</p>
      <button class="form-submit-btn" onclick="setBenchmark()">YES</button>
      <button class="form-exit-btn" onclick="closeForm()">CANCEL</button>
    `;
  } else {
    formBox.innerHTML = `
      <input type="text" id="detail" placeholder="Detail" class="form-input" />
      <input type="text" id="amount" placeholder="Amount" class="form-input" />
      <input type="text" id="bank" placeholder="Bank" class="form-input" />
      <button class="form-submit-btn" onclick="submitForm()">SUBMIT</button>
      <button class="form-exit-btn" onclick="closeForm()">CANCEL</button>
    `;
  }
  formBox.classList.remove('visible');
  void formBox.offsetWidth;
  formBox.classList.add('visible');
}

function closeForm() {
  const formPage = document.getElementById('form-page');
  const formBox = formPage.querySelector('.form-box');
  formBox.classList.remove('visible');
  formBox.classList.add('fade-down');
  setTimeout(() => {
    formBox.classList.remove('fade-down');
    formPage.classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');
  }, 400);
}

// Final export bindings
window.openForm = openForm;
window.closeForm = closeForm;
window.submitForm = () => {};
window.openBankDetail = () => {};
window.deleteTransaction = () => {};
window.deleteBank = () => {};
window.returnToHomepage = () => {};
window.logout = () => {};
window.loadProfilePic = loadProfilePic;
window.setBenchmark = () => {};
window.closePopup = () => {};
window.openBenchmarkPopup = () => {};
