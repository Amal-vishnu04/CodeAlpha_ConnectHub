// Shared helpers: API client, session, theme, navbar, search, notifications
document.documentElement.dataset.theme = localStorage.getItem('ch_theme') || 'light';

const store = {
  get token() { return localStorage.getItem('ch_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('ch_user')); } catch { return null; } },
  save(token, user) { localStorage.setItem('ch_token', token); localStorage.setItem('ch_user', JSON.stringify(user)); },
  setUser(user) { localStorage.setItem('ch_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('ch_token'); localStorage.removeItem('ch_user'); }
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(store.token ? { Authorization: 'Bearer ' + store.token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !/login|register/.test(location.pathname)) { store.clear(); location.href = '/login.html'; }
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function toast(message, type = 'success') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + type; el.textContent = message; el.setAttribute('role', 'status');
  box.appendChild(el); setTimeout(() => el.remove(), 3000);
}

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24); if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function avatar(user, size = 42) {
  const style = `width:${size}px;height:${size}px;font-size:${size / 2.4}px`;
  if (user?.profilePicture) return `<img class="avatar" style="${style}" src="${esc(user.profilePicture)}" alt="${esc(user.name)}">`;
  let h = 0; for (const c of user?.username || 'x') h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<div class="avatar" style="${style};background:hsl(${h},60%,45%)" aria-label="${esc(user?.name)}">${esc((user?.name || '?')[0].toUpperCase())}</div>`;
}

function readImage(file, maxMB = 2) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    if (file.size > maxMB * 1024 * 1024) return reject(new Error(`Image must be under ${maxMB} MB.`));
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('Could not read that image.')); r.readAsDataURL(file);
  });
}

function requireAuth() {
  if (!store.token) { location.href = '/login.html'; return false; }
  return true;
}

function initNav() {
  const me = store.user;
  const nav = document.getElementById('navbar');
  const page = location.pathname;
  nav.className = 'navbar';
  nav.innerHTML = `
    <a class="brand" href="/">🔗 ConnectHub</a>
    <div class="search"><input id="searchInput" type="search" placeholder="Search people..." aria-label="Search people" autocomplete="off">
      <div id="searchResults" class="dropdown hidden"></div></div>
    <div class="nav-links">
      <a href="/" class="${page === '/' || page.endsWith('index.html') ? 'active' : ''}">🏠 <span class="label">Feed</span></a>
      <a href="/profile.html?id=${me.id}" class="${page.endsWith('profile.html') ? 'active' : ''}">👤 <span class="label">My Profile</span></a>
      <button class="icon-btn" id="bellBtn" aria-label="Notifications">🔔<span id="bellBadge" class="badge hidden">0</span></button>
      <button class="icon-btn" id="themeBtn" aria-label="Toggle dark mode"></button>
      <button class="icon-btn" id="logoutBtn">🚪 <span class="label">Logout</span></button>
    </div>
    <div id="notifPanel" class="notif-panel hidden"></div>`;

  const themeBtn = document.getElementById('themeBtn');
  const paintTheme = () => { themeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'; };
  paintTheme();
  themeBtn.onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; localStorage.setItem('ch_theme', next); paintTheme();
  };
  document.getElementById('logoutBtn').onclick = () => { store.clear(); location.href = '/login.html'; };

  // Search (debounced)
  const input = document.getElementById('searchInput'), results = document.getElementById('searchResults');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) return results.classList.add('hidden');
    timer = setTimeout(async () => {
      try {
        const users = await api('/users/search?q=' + encodeURIComponent(q));
        results.innerHTML = users.length ? users.map((u) => `
          <div class="item" data-id="${u._id}">${avatar(u, 36)}<div><div>${esc(u.name)}</div><div class="muted">@${esc(u.username)}</div></div></div>`).join('')
          : `<div class="empty"><h3>No users found</h3>Try a different name or username.</div>`;
        results.classList.remove('hidden');
      } catch (e) { toast(e.message, 'error'); }
    }, 250);
  });
  results.onclick = (e) => { const it = e.target.closest('.item'); if (it) location.href = '/profile.html?id=' + it.dataset.id; };
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) results.classList.add('hidden'); });

  initNotifications();
}

async function refreshBadge() {
  try {
    const { count } = await api('/notifications/unread-count');
    const b = document.getElementById('bellBadge');
    b.textContent = count > 9 ? '9+' : count; b.classList.toggle('hidden', !count);
  } catch {}
}

function initNotifications() {
  const panel = document.getElementById('notifPanel');
  refreshBadge(); setInterval(refreshBadge, 30000);
  document.getElementById('bellBtn').onclick = async (e) => {
    e.stopPropagation();
    if (!panel.classList.contains('hidden')) return panel.classList.add('hidden');
    try {
      const list = await api('/notifications');
      panel.innerHTML = '<h3>Notifications</h3>' + (list.length ? list.map((n) => `
        <div class="item ${n.isRead ? '' : 'unread'}" data-user="${n.sender?._id}">${avatar(n.sender, 36)}
          <div><div>${esc(n.message)}</div><div class="muted">${timeAgo(n.createdAt)}${n.isRead ? '' : ' · New'}</div></div></div>`).join('')
        : `<div class="empty"><h3>No notifications yet</h3>Likes, comments and new followers will show up here.</div>`);
      panel.classList.remove('hidden');
      if (list.some((n) => !n.isRead)) { await api('/notifications/read-all', { method: 'PUT' }); refreshBadge(); }
    } catch (err) { toast(err.message, 'error'); }
  };
  panel.onclick = (e) => { const it = e.target.closest('.item'); if (it?.dataset.user) location.href = '/profile.html?id=' + it.dataset.user; };
  document.addEventListener('click', (e) => { if (!e.target.closest('#notifPanel')) panel.classList.add('hidden'); });
}
