// ============================================================
// Ashaktashram Dakor - Frontend Configuration
// ============================================================

// Default production backend on Render
const DEFAULT_PROD_BACKEND = 'https://old-age-home-sevasadan.onrender.com';

function sanitizeBackendUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim()
    .replace(/\/dashboard\/?$/i, '')
    .replace(/\/api\/?$/i, '')
    .replace(/\/$/, '');
}

function detectApiBase() {
  // 1. Check window.__ENV__ (injected via Vercel build / env.js)
  const envUrl = window.__ENV__ && (
    window.__ENV__.BACKEND_URL || 
    window.__ENV__.API_BASE_URL || 
    window.__ENV__.NEXT_PUBLIC_API_URL || 
    window.__ENV__.VITE_API_URL
  );
  if (envUrl) {
    const cleaned = sanitizeBackendUrl(envUrl);
    if (cleaned) return cleaned;
  }

  // 2. Check localStorage override (useful for debugging or manual override)
  const saved = localStorage.getItem('BACKEND_URL') || localStorage.getItem('API_BASE_URL');
  if (saved) {
    const cleaned = sanitizeBackendUrl(saved);
    if (cleaned) return cleaned;
  }

  // 3. Localhost development
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost && window.location.port === '3000') {
    return '';
  }
  if (isLocalhost || window.location.protocol === 'file:' || !window.location.hostname) {
    return 'http://localhost:3000';
  }

  // 4. Default for production deployment (e.g. on Vercel)
  return DEFAULT_PROD_BACKEND;
}

window.API_BASE = detectApiBase();

window.getApiUrl = function(path) {
  if (!path.startsWith('/')) path = '/' + path;
  if (!window.API_BASE) return path;
  return window.API_BASE.replace(/\/$/, '') + path;
};

window.getAssetUrl = function(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (window.API_BASE) return window.API_BASE.replace(/\/$/, '') + path;
  return path;
};
