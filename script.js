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
    const userSnap = await get(child(ref(db), users/${username}/password));

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
      const userSnap = await get(child(ref(db), users/${savedUser}/password));
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
        set(ref(db, users/${currentUser}/profilePic), base64Image);
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

  // Clear existing content
  formBox.innerHTML = '';

  if (type === 'benchmark') {
    formBox.innerHTML = 
      <p style="text-align:center; font-weight:bold;">Set current total as benchmark?</p>
      <button class="form-submit-btn" onclick="setBenchmark()">YES</button>
      <button class="form-exit-btn" onclick="closeForm()">CANCEL</button>
    ;
  } else {
    formBox.innerHTML = 
      <input type="text" id="detail" placeholder="Detail" class="form-input" />
      <input type="text" id="amount" placeholder="Amount" class="form-input" />
      <input type="text" id="bank" placeholder="Bank" class="form-input" />
      <button class="form-submit-btn" onclick="submitForm()">SUBMIT</button>
      <button class="form-exit-btn" onclick="closeForm()">CANCEL</button>
    ;
  }

  // Show the box with animation
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

  try {
    const bankSnap = await get(child(ref(db), users/${currentUser}/banks));
    const historySnap = await get(child(ref(db), users/${currentUser}/history));

    let banks = bankSnap.exists() ? bankSnap.val() : {};
    let history = historySnap.exists() ? historySnap.val() : {};

    if (!banks[bank]) banks[bank] = 0;
    if (!history[bank]) history[bank] = [];

    banks[bank] = type === 'income' ? banks[bank] + amount : banks[bank] - amount;
    history[bank].push({ detail, type, amount, balance: banks[bank] });

    await set(ref(db, users/${currentUser}/banks), banks);
    await set(ref(db, users/${currentUser}/history), history);

    loadBankData();
    updateTotalBalance();
    updateGainDisplay();

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
    }, 400);
  } catch (error) {
    console.error("Submit error:", error);
  }
}

async function loadBankData() {
  try {
    const bankSnap = await get(child(ref(db), users/${currentUser}/banks));
    const banks = bankSnap.exists() ? bankSnap.val() : {};
    const list = document.getElementById('bank-list');
    list.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (const bank in banks) {
      const item = document.createElement('div');
      item.className = 'bank-item';
      item.innerHTML = 
        <strong onclick="openBankDetail('${bank}')">${bank}</strong>
        <span class="bank-balance-with-delete">
          ${banks[bank].toLocaleString()}
          <span class="delete-bank-btn" onclick="deleteBank(event, '${bank}')">×</span>
        </span>
      ;
      fragment.appendChild(item);
    }

    list.appendChild(fragment);
    updateTotalBalance();
  } catch (error) {
    console.error("Load bank error:", error);
  }
}

async function openBankDetail(bankName) {
  document.getElementById('homepage').classList.add('hidden');
  document.getElementById('form-page').classList.add('hidden');
  document.getElementById('bank-detail-page').classList.remove('hidden');
  document.getElementById('bank-name').textContent = bankName;

  try {
    const historySnap = await get(child(ref(db), users/${currentUser}/history/${bankName}));
    const entries = historySnap.exists() ? historySnap.val() : [];
    const tbody = document.getElementById('bank-detail-body');
    tbody.innerHTML = '';

    // 🧠 Use a DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      const inCol = entry.type === 'income' ? entry.amount.toLocaleString() : '';
      const outCol = entry.type === 'expense' ? entry.amount.toLocaleString() : '';

      row.innerHTML = 
        <td><em>${entry.detail}</em></td>
        <td>${inCol}</td>
        <td>${outCol}</td>
        <td>
          ${entry.balance.toLocaleString()}
          <button onclick="deleteTransaction('${bankName}', ${index})" class="delete-transaction-btn">✖</button>
        </td>
      ;

      fragment.appendChild(row);
    });

    // 🧩 Append all rows in one go = fewer reflows
    tbody.appendChild(fragment);

    // Update the displayed total
    document.getElementById('bank-total').textContent =
      entries.length > 0
        ? entries[entries.length - 1].balance.toLocaleString()
        : '0';
  } catch (error) {
    console.error("Bank detail error:", error);
  }
}

async function deleteTransaction(bankName, index) {
  if (!confirm("Delete this transaction?")) return;

  try {
    const historySnap = await get(child(ref(db), users/${currentUser}/history));
    const history = historySnap.exists() ? historySnap.val() : {};

    if (!history[bankName]) return;
    history[bankName].splice(index, 1);

    let balance = 0;
    history[bankName].forEach(entry => {
      balance += entry.type === 'income' ? entry.amount : -entry.amount;
      entry.balance = balance;
    });

    const banks = await get(child(ref(db), users/${currentUser}/banks)).then(snap => snap.val() || {});
    banks[bankName] = balance;

    await set(ref(db, users/${currentUser}/history), history);
    await set(ref(db, users/${currentUser}/banks), banks);

    openBankDetail(bankName);
    loadBankData();
    updateTotalBalance();
    updateGainDisplay();
    
  } catch (error) {
    console.error("Delete transaction error:", error);
  }
}

async function deleteBank(event, bankName) {
  event.stopPropagation();
  if (!confirm(Are you sure you want to delete ${bankName}?)) return;

  try {
    const bankSnap = await get(child(ref(db), users/${currentUser}/banks));
    const historySnap = await get(child(ref(db), users/${currentUser}/history));

    const banks = bankSnap.exists() ? bankSnap.val() : {};
    const history = historySnap.exists() ? historySnap.val() : {};

    delete banks[bankName];
    delete history[bankName];

    await set(ref(db, users/${currentUser}/banks), banks);
    await set(ref(db, users/${currentUser}/history), history);

    loadBankData();
    updateTotalBalance();
    updateGainDisplay();
    
  } catch (error) {
    console.error("Delete bank error:", error);
  }
}

async function setBenchmark() {
  try {
    const total = calculateCurrentTotal(); // total from bank-list
    await set(ref(db, users/${currentUser}/benchmark), total);
    closePopup();
    updateGainDisplay(total); // optional instant update
    alert("Benchmark set successfully!");
  } catch (err) {
    console.error("Benchmark error:", err);
    alert("Failed to set benchmark.");
  }
}

function calculateCurrentTotal() {
  let total = 0;
  document.querySelectorAll('.bank-item span').forEach(span => {
    const numText = span.childNodes[0].textContent.trim().replace(/,/g, '');
    const value = parseFloat(numText);
    if (!isNaN(value)) total += value;
  });
  return total;
}

async function updateGainDisplay(overrideBenchmark = null) {
  try {
    let benchmark = overrideBenchmark;
    if (benchmark === null) {
      const snap = await get(child(ref(db), users/${currentUser}/benchmark));
      if (!snap.exists()) return; // No benchmark set yet
      benchmark = snap.val();
    }

    const currentTotal = calculateCurrentTotal();
    const change = currentTotal - benchmark;
    const percent = ((change / benchmark) * 100).toFixed(2);

    const gainText = (change >= 0 ? "+" : "") + percent + "%";
    const gainDisplay = document.getElementById('gain-display');
    gainDisplay.textContent = gainText;
    gainDisplay.style.color = change >= 0 ? 'lime' : 'red';
  } catch (err) {
    console.error("Gain display error:", err);
  }
}

function returnToHomepage() {
  document.getElementById('bank-detail-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
  updateTotalBalance(); // ✅ Add this here
}

function updateTotalBalance() {
  let total = 0;
  document.querySelectorAll('.bank-item span').forEach(span => {
    const numText = span.childNodes[0].textContent.trim().replace(/,/g, '');
    const value = parseFloat(numText);
    if (!isNaN(value)) total += value;
  });
  document.getElementById('total-balance').textContent = total.toLocaleString();
}

function confirmBenchmarkPopup() {
  document.getElementById('benchmark-popup').classList.remove('hidden');
  document.body.classList.add('lock-scroll');
}

function closePopup() {
  document.getElementById('benchmark-popup').classList.add('hidden');
  document.body.classList.remove('lock-scroll');
}

function logout() {
  localStorage.removeItem('loggedInUser');
  currentUser = null;

  // Reset UI state
  document.getElementById('homepage').classList.add('hidden');
  document.getElementById('form-page').classList.add('hidden');
  document.getElementById('bank-detail-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
}

window.openForm = openForm;
window.closeForm = closeForm;
window.submitForm = submitForm;
window.openBankDetail = openBankDetail;
window.deleteTransaction = deleteTransaction;
window.deleteBank = deleteBank;
window.returnToHomepage = returnToHomepage;
window.logout = logout;
window.loadProfilePic = loadProfilePic;
window.setBenchmark = setBenchmark;
window.closePopup = closePopup;
window.openBenchmarkPopup = confirmBenchmarkPopup;
