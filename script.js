// ✅ Firebase setup (make sure this is in your HTML too)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyB0KEuTX22TijLqgDdeS_kxyrzIZs9kc8E",
    authDomain: "budgeting-id.firebaseapp.com",
    projectId: "budgeting-id",
    storageBucket: "budgeting-id.firebasestorage.app",
    messagingSenderId: "710126347620",
    appId: "1:710126347620:web:e2e4f2f5c7a489d6d78671",
    measurementId: "G-9EXTLK9LCD"
    databaseURL: "https://budgeting-id-default-rtdb.firebaseio.com/"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

let currentUser = null;

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value.trim();

  try {
    const snapshot = await get(child(ref(db), `users/${username}`));
    if (!snapshot.exists()) {
      alert("Invalid username.");
      return;
    }

    const userData = snapshot.val();
    if (userData.password !== password) {
      alert("Invalid password.");
      return;
    }

    currentUser = username;
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');

    await loadBankData();
    await loadProfilePic();
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector('.btn');
  loginBtn?.addEventListener('click', handleLogin);
});

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
    profileInput.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file || !currentUser) return;

      const reader = new FileReader();
      reader.onload = async function (e) {
        const base64Image = e.target.result;
        document.getElementById('profile-pic').src = base64Image;
        await set(ref(db, `users/${currentUser}/profilePic`), base64Image);
      };
      reader.readAsDataURL(file);
    });
  }
});

async function loadProfilePic() {
  const snapshot = await get(child(ref(db), `users/${currentUser}/profilePic`));
  if (snapshot.exists()) {
    document.getElementById('profile-pic').src = snapshot.val();
  }
}

function openForm(type) {
  const formPage = document.getElementById('form-page');
  const formBox = formPage.querySelector('.form-box');
  document.getElementById('homepage').classList.add('hidden');
  formPage.classList.remove('hidden');
  formPage.dataset.type = type;
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

async function submitForm() {
  const type = document.getElementById('form-page').dataset.type;
  const detail = document.getElementById('detail').value;
  const amount = parseFloat(document.getElementById('amount').value.replace(/,/g, ''));
  const bank = document.getElementById('bank').value.trim().toUpperCase();

  if (!detail || isNaN(amount) || !bank) return alert('Fill all fields');

  const snapshot = await get(child(ref(db), `users/${currentUser}/banks`));
  let banks = snapshot.exists() ? snapshot.val() : {};
  if (!banks[bank]) banks[bank] = 0;
  banks[bank] = type === 'income' ? banks[bank] + amount : banks[bank] - amount;
  await set(ref(db, `users/${currentUser}/banks`), banks);

  // Animate and reset form
  const formPage = document.getElementById('form-page');
  const formBox = formPage.querySelector('.form-box');
  formBox.classList.remove('visible');
  formBox.classList.add('fade-out');
  setTimeout(() => {
    formBox.classList.remove('fade-out');
    formPage.classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');
    document.getElementById('detail').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('bank').value = '';
    loadBankData();
  }, 400);
}

async function loadBankData() {
  const snapshot = await get(child(ref(db), `users/${currentUser}/banks`));
  const banks = snapshot.exists() ? snapshot.val() : {};
  const list = document.getElementById('bank-list');
  list.innerHTML = '';
  let total = 0;
  for (const bank in banks) {
    total += banks[bank];
    const item = document.createElement('div');
    item.className = 'bank-item';
    item.innerHTML = `
      <strong onclick="openBankDetail('${bank}')">${bank}</strong>
      <span class="bank-balance-with-delete">
      ${banks[bank].toLocaleString()}
      <span class="delete-bank-btn" onclick="deleteBank(event, '${bank}')">×</span>
      </span>
    `;
    list.appendChild(item);
  }
  document.getElementById('total-balance').textContent = total.toLocaleString();
}

async function deleteBank(event, bankName) {
  event.stopPropagation();
  if (!confirm(`Are you sure you want to delete ${bankName}?`)) return;
  const snapshot = await get(child(ref(db), `users/${currentUser}/banks`));
  let banks = snapshot.exists() ? snapshot.val() : {};
  delete banks[bankName];
  await set(ref(db, `users/${currentUser}/banks`), banks);
  loadBankData();
}

function returnToHomepage() {
  document.getElementById('bank-detail-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
}
