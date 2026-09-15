// ============================================================
// Ashaktashram Dakor - Frontend Configuration
// ============================================================

// If you deploy backend on Render and frontend on Vercel:
// Replace the URL below with your actual Render backend URL,
// or set it in browser console / localStorage: localStorage.setItem('API_BASE_URL', 'https://your-backend.onrender.com')

window.API_BASE = localStorage.getItem('API_BASE_URL') || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''
    : '' // When you deploy on Render, paste your URL here: e.g. 'https://old-sevasadan.onrender.com'
);

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
