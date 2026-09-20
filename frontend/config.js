// ============================================================
// Ashaktashram Dakor - Frontend Configuration
// ============================================================

// If you deploy backend on Render and frontend on Vercel:
// Replace the URL below with your actual Render backend URL,
// or set it in browser console / localStorage: localStorage.setItem('API_BASE_URL', 'https://your-backend.onrender.com')

function detectApiBase() {
  const saved = localStorage.getItem('API_BASE_URL');
  if (saved) return saved;

  // If already accessing backend directly on port 3000, use relative paths
  if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '3000') {
    return '';
  }

  // If on localhost/127.0.0.1 on a different port (e.g. Live Server on 5500) or file:// protocol, route to port 3000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname) {
    return 'http://localhost:3000';
  }

  return '';
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
