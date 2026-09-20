// ============================================================
// Vercel Build Script - Injects BACKEND_URL into frontend
// ============================================================
const fs = require('fs');
const path = require('path');

function sanitizeBackendUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim()
    .replace(/\/dashboard\/?$/i, '')
    .replace(/\/api\/?$/i, '')
    .replace(/\/$/, '');
}

const rawUrl = process.env.BACKEND_URL || 
               process.env.API_BASE_URL || 
               process.env.NEXT_PUBLIC_API_URL || 
               process.env.VITE_API_URL || 
               'https://old-age-home-sevasadan.onrender.com';

const sanitizedUrl = sanitizeBackendUrl(rawUrl);

const envJsContent = `// Auto-generated during build from environment variable BACKEND_URL
window.__ENV__ = window.__ENV__ || {};
window.__ENV__.BACKEND_URL = ${JSON.stringify(sanitizedUrl)};
`;

const targets = [
  path.join(__dirname, 'frontend', 'env.js')
];

targets.forEach(target => {
  try {
    fs.writeFileSync(target, envJsContent, 'utf8');
    console.log(`[build] Injected BACKEND_URL: "${sanitizedUrl}" into ${target}`);
  } catch (err) {
    console.error(`[build] Error writing to ${target}:`, err.message);
  }
});
