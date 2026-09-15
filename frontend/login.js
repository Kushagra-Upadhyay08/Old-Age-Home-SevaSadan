document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  const token = localStorage.getItem('auth_token');
  if (token) {
    window.location.href = '/dashboard';
    return;
  }

  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const langBtn = document.getElementById('login-lang-btn');
  const langText = document.getElementById('login-lang-text');
  let currentLang = localStorage.getItem('app_lang') || 'en';

  // Apply saved theme
  const savedTheme = localStorage.getItem('app_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateLang() {
    const enEls = document.querySelectorAll('.display-lang-en');
    const guEls = document.querySelectorAll('.display-lang-gu');
    if (currentLang === 'en') {
      enEls.forEach(el => el.style.display = '');
      guEls.forEach(el => el.style.display = 'none');
      langText.textContent = 'ગુજરાતી';
    } else {
      enEls.forEach(el => el.style.display = 'none');
      guEls.forEach(el => el.style.display = '');
      langText.textContent = 'English';
    }
  }

  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'gu' : 'en';
    localStorage.setItem('app_lang', currentLang);
    updateLang();
  });

  updateLang();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      errorBox.textContent = currentLang === 'en' ? 'Please fill all fields.' : 'કૃપા કરીને બધા ક્ષેત્રો ભરો.';
      errorBox.style.display = 'block';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span>';

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Success animation
        document.querySelector('.login-card').classList.add('login-success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 600);
      } else {
        errorBox.textContent = data.message || (currentLang === 'en' ? 'Login failed.' : 'લોગ ઇન નિષ્ફળ.');
        errorBox.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.innerHTML = `<span class="display-lang-en">Sign In</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">લોગ ઇન</span><svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
        updateLang();
      }
    } catch (err) {
      errorBox.textContent = currentLang === 'en' ? 'Connection error. Please try again.' : 'કનેક્શન ભૂલ. ફરી પ્રયાસ કરો.';
      errorBox.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.innerHTML = `<span class="display-lang-en">Sign In</span><span class="display-lang-gu" style="display:${currentLang === 'gu' ? '' : 'none'};">લોગ ઇન</span><svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
      updateLang();
    }
  });
});
