// Login page
import { auth as authApi } from '../api.js';
import { login, isLoggedIn, getRole } from '../auth.js';
import { showToast } from '../components/utils.js';
import { navigate } from '../router.js';

export default function LoginPage(container) {
  // Redirect if already logged in
  if (isLoggedIn()) {
    const role = getRole();
    if (role === 'pembeli') navigate('/order/menu');
    else if (role === 'kasir') navigate('/pos/dashboard');
    else navigate('/core/dashboard');
    return;
  }

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="auth-bg-pattern"></div>
      </div>
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">
            <span class="auth-logo-icon">🍜</span>
            <h1 class="auth-brand">Muma Ramen</h1>
            <p class="auth-tagline">Japanese Ramen House</p>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Masuk</button>
            <button class="auth-tab" data-tab="register">Daftar</button>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-icon-wrap">
                <i class="fa-solid fa-envelope"></i>
                <input type="email" class="form-input" id="login-email" placeholder="email@contoh.com" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-icon-wrap">
                <i class="fa-solid fa-lock"></i>
                <input type="password" class="form-input" id="login-password" placeholder="Masukkan password" required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;">
              <i class="fa-solid fa-right-to-bracket"></i> Masuk
            </button>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="auth-form" style="display:none;">
            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <div class="input-icon-wrap">
                <i class="fa-solid fa-user"></i>
                <input type="text" class="form-input" id="reg-name" placeholder="Nama kamu" required minlength="2" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-icon-wrap">
                <i class="fa-solid fa-envelope"></i>
                <input type="email" class="form-input" id="reg-email" placeholder="email@contoh.com" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-icon-wrap">
                <i class="fa-solid fa-lock"></i>
                <input type="password" class="form-input" id="reg-password" placeholder="Min 6 karakter" required minlength="6" />
              </div>
            </div>
            <button type="submit" class="btn btn-orange btn-lg" style="width:100%;">
              <i class="fa-solid fa-user-plus"></i> Daftar Sekarang
            </button>
          </form>

          <div class="auth-demo-info">
            <p class="auth-demo-title"><i class="fa-solid fa-circle-info"></i> Demo Accounts</p>
            <div class="auth-demo-accounts">
              <div class="demo-account" data-email="pembeli@mumaramen.com" data-password="pembeli123">
                <span class="badge badge-role-pembeli">Pembeli</span>
                <code>pembeli@mumaramen.com</code>
              </div>
              <div class="demo-account" data-email="kasir@mumaramen.com" data-password="kasir123">
                <span class="badge badge-role-kasir">Kasir</span>
                <code>kasir@mumaramen.com</code>
              </div>
              <div class="demo-account" data-email="admin@mumaramen.com" data-password="admin123">
                <span class="badge badge-role-admin">Admin</span>
                <code>admin@mumaramen.com</code>
              </div>
              <div class="demo-account" data-email="superadmin@mumaramen.com" data-password="superadmin123">
                <span class="badge badge-role-superadmin">Super Admin</span>
                <code>superadmin@mumaramen.com</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
      document.getElementById('register-form').style.display = isLogin ? 'none' : 'block';
    });
  });

  // Demo account quick-fill
  container.querySelectorAll('.demo-account').forEach(acc => {
    acc.addEventListener('click', () => {
      document.getElementById('login-email').value = acc.dataset.email;
      document.getElementById('login-password').value = acc.dataset.password;
      // Switch to login tab
      container.querySelector('[data-tab="login"]').click();
    });
  });

  // Login handler
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Masuk...';

    try {
      const data = await authApi.login(
        document.getElementById('login-email').value,
        document.getElementById('login-password').value
      );
      login(data.token, data.user);
      showToast(`Selamat datang, ${data.user.name}!`, 'success');

      // Redirect based on role
      const role = data.user.role;
      if (role === 'pembeli') navigate('/order/menu');
      else if (role === 'kasir') navigate('/pos/dashboard');
      else navigate('/core/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk';
    }
  });

  // Register handler
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...';

    try {
      const data = await authApi.register(
        document.getElementById('reg-name').value,
        document.getElementById('reg-email').value,
        document.getElementById('reg-password').value
      );
      login(data.token, data.user);
      showToast('Registrasi berhasil! Selamat datang 🍜', 'success');
      navigate('/order/menu');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Daftar Sekarang';
    }
  });
}
