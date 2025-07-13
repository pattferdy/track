const users = {
  user1: { password: 'pass1' },
  user2: { password: 'pass2' }
};

let currentUser = null;

function handleLogin() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value.trim().toLowerCase();

  if (!users[username] || users[username].password !== password) {
    alert("Invalid username or password.");
    return;
  }

  currentUser = username;
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
  loadBankData();
  updateTotalBalance();
  loadProfilePic();
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector('.btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

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
        localStorage.setItem(`${currentUser}_profilePic`, base64Image);
      };
      reader.readAsDataURL(file);
    });
  }
});

function loadProfilePic() {
  const savedPic = localStorage.getItem(`${currentUser}_profilePic`);
  if (savedPic) {
    document.getElementById('profile-pic').src = savedPic;
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

  // Trigger the fade-down animation
  formBox.classList.remove('visible'); // Remove fade-in class
  formBox.classList.add('fade-down');  // Add fade-out-down class

  // Delay hiding until animation completes
  setTimeout(() => {
    formBox.classList.remove('fade-down');
    formPage.classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');
  }, 400); // Match your CSS transition duration
}

function submitForm() {
  const type = document.getElementById('form-page').dataset.type;
  const detail = document.getElementById('detail').value;
  const amount = parseFloat(document.getElementById('amount').value.replace(/,/g, ''));
  const bank = document.getElementById('bank').value.trim().toUpperCase();

  if (!detail || isNaN(amount) || !bank) return alert('Fill all fields');

  let banks = JSON.parse(localStorage.getItem(`${currentUser}_banks`) || '{}');
  let history = JSON.parse(localStorage.getItem(`${currentUser}_history`) || '{}');

  if (!banks[bank]) banks[bank] = 0;
  if (!history[bank]) history[bank] = [];

  banks[bank] = type === 'income' ? banks[bank] + amount : banks[bank] - amount;
  history[bank].push({ detail, type, amount, balance: banks[bank] });

  localStorage.setItem(`${currentUser}_banks`, JSON.stringify(banks));
  localStorage.setItem(`${currentUser}_history`, JSON.stringify(history));

  loadBankData();
  updateTotalBalance();

  // Start fade-out animation
  const formPage = document.getElementById('form-page');
  const formBox = formPage.querySelector('.form-box');
  formBox.classList.remove('visible');
  formBox.classList.add('fade-out');

  // After animation completes, hide the form and show homepage
  setTimeout(() => {
    formBox.classList.remove('fade-out');
    formPage.classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');

    // Clear form fields
    document.getElementById('detail').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('bank').value = '';
  }, 400); // match your CSS transition duration
}

function openBankDetail(bankName) {
  document.getElementById('homepage').classList.add('hidden');
  document.getElementById('form-page').classList.add('hidden');
  document.getElementById('bank-detail-page').classList.remove('hidden');
  document.getElementById('bank-name').textContent = bankName;

  const history = JSON.parse(localStorage.getItem(`${currentUser}_history`) || '{}');
  const entries = history[bankName] || [];
  const tbody = document.getElementById('bank-detail-body');
  tbody.innerHTML = '';

  entries.forEach((entry, index) => {
    const row = document.createElement('tr');
    const inCol = entry.type === 'income' ? entry.amount.toLocaleString() : '';
    const outCol = entry.type === 'expense' ? entry.amount.toLocaleString() : '';
    
    row.innerHTML = `
      <td><em>${entry.detail}</em></td>
      <td>${inCol}</td>
      <td>${outCol}</td>
      <td>
      ${entry.balance.toLocaleString()}
      <button onclick="deleteTransaction('${bankName}', ${index})" class="delete-transaction-btn">✖</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (entries.length > 0) {
    const latestBalance = entries[entries.length - 1].balance;
    document.getElementById('bank-total').textContent = latestBalance.toLocaleString();
  } else {
    document.getElementById('bank-total').textContent = '0';
  }
}

function deleteTransaction(bankName, index) {
  if (!confirm("Delete this transaction?")) return;

  let history = JSON.parse(localStorage.getItem(`${currentUser}_history`) || '{}');
  let banks = JSON.parse(localStorage.getItem(`${currentUser}_banks`) || '{}');

  if (!history[bankName]) return;

  history[bankName].splice(index, 1);

  let balance = 0;
  history[bankName].forEach(entry => {
    balance += entry.type === 'income' ? entry.amount : -entry.amount;
    entry.balance = balance;
  });

  banks[bankName] = balance;

  localStorage.setItem(`${currentUser}_banks`, JSON.stringify(banks));
  localStorage.setItem(`${currentUser}_history`, JSON.stringify(history));

  openBankDetail(bankName);
  loadBankData();
  updateTotalBalance();
}

function returnToHomepage() {
  document.getElementById('bank-detail-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
}

function updateTotalBalance() {
  let total = 0;
  document.querySelectorAll('.bank-item span').forEach(span => {
    // Get only digits and commas before the X
    const numText = span.childNodes[0].textContent.trim().replace(/,/g, '');
    const value = parseFloat(numText);
    if (!isNaN(value)) total += value;
  });
  document.getElementById('total-balance').textContent = total.toLocaleString();
}

function loadBankData() {
  const banks = JSON.parse(localStorage.getItem(`${currentUser}_banks`) || '{}');
  const list = document.getElementById('bank-list');
  list.innerHTML = '';
  for (const bank in banks) {
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
}

function deleteBank(event, bankName) {
  event.stopPropagation();

  if (!confirm(`Are you sure you want to delete ${bankName}?`)) return;

  let banks = JSON.parse(localStorage.getItem(`${currentUser}_banks`) || '{}');
  let history = JSON.parse(localStorage.getItem(`${currentUser}_history`) || '{}');

  delete banks[bankName];
  delete history[bankName];

  localStorage.setItem(`${currentUser}_banks`, JSON.stringify(banks));
  localStorage.setItem(`${currentUser}_history`, JSON.stringify(history));

  loadBankData();
  updateTotalBalance();
}
