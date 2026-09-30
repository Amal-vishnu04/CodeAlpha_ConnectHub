// Handles both login.html and register.html
if (store.token) location.href = '/';

const showError = (msg) => { const el = document.getElementById('formError'); el.textContent = msg; el.classList.toggle('hidden', !msg); };

async function submitAuth(e, path, buildBody) {
  e.preventDefault(); showError('');
  const btn = e.target.querySelector('button.btn'); btn.disabled = true;
  try {
    const body = await buildBody(e.target);
    const { token, user } = await api(path, { method: 'POST', body });
    store.save(token, user); location.href = '/';
  } catch (err) { showError(err.message); btn.disabled = false; }
}

document.getElementById('loginForm')?.addEventListener('submit', (e) =>
  submitAuth(e, '/auth/login', (f) => ({ identifier: f.identifier.value, password: f.password.value })));

document.getElementById('registerForm')?.addEventListener('submit', (e) =>
  submitAuth(e, '/auth/register', async (f) => {
    if (f.password.value !== f.confirmPassword.value) throw new Error('Passwords do not match.');
    const file = f.pic.files[0];
    return {
      name: f.name.value, username: f.username.value, email: f.email.value,
      password: f.password.value, confirmPassword: f.confirmPassword.value,
      profilePicture: file ? await readImage(file, 1) : ''
    };
  }));
