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
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector('.btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
});

function openForm(type) {
  document.getElementById('homepage').classList.add('hidden');
  document.getElementById('form-page').classList.remove('hidden');
  document.getElementById('form-page').dataset.type = type;
}

function closeForm() {
  document.getElementById('form-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
}

function submitForm() {
  const type = document.getElementById('form-page').dataset.type;
  const detail = document.getElementById('detail').value;
  const amount = parseFloat(document.getElementById('amount').value);
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

  document.getElementById('form-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');

  document.getElementById('detail').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('bank').value = '';
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

  entries.forEach(entry => {
    const row = document.createElement('tr');
    const inCol = entry.type === 'income' ? entry.amount.toLocaleString() : '';
    const outCol = entry.type === 'expense' ? entry.amount.toLocaleString() : '';
    row.innerHTML = `<td><em>${entry.detail}</em></td><td>${inCol}</td><td>${outCol}</td><td>${entry.balance.toLocaleString()}</td>`;
    tbody.appendChild(row);
  });

  if (entries.length > 0) {
    const latestBalance = entries[entries.length - 1].balance;
    document.getElementById('bank-total').textContent = latestBalance.toLocaleString();
  } else {
    document.getElementById('bank-total').textContent = '0';
  }
}

function returnToHomepage() {
  document.getElementById('bank-detail-page').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
}

function updateTotalBalance() {
  let total = 0;
  document.querySelectorAll('.bank-item span').forEach(span => {
    total += parseFloat(span.textContent.replace(/,/g, ''));
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
    item.setAttribute('onclick', `openBankDetail('${bank}')`);
    item.innerHTML = `<strong>${bank}</strong> <span>${banks[bank].toLocaleString()}</span>`;
    list.appendChild(item);
  }
}
