/**
 * Lightweight Local Development Server (Zero Dependencies)
 * Serves static assets and runs /api/verify with .env configuration
 * Usage: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env or .env.local
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
      break;
    }
  }
}

loadEnv();

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Handle /api/verify and /api/leaderboard endpoints
  if (pathname === '/api/verify' || pathname === '/api/leaderboard') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      const vReq = {
        method: req.method,
        body: bodyData,
        headers: req.headers
      };

      const vRes = {
        setHeader: (k, v) => res.setHeader(k, v),
        status: (code) => {
          res.statusCode = code;
          return {
            json: (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end: () => res.end()
          };
        }
      };

      try {
        const handlerName = pathname === '/api/verify' ? './api/verify.js' : './api/leaderboard.js';
        const handler = require(handlerName);
        await handler(vReq, vRes);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Handle Static Files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found');
      return;
    }

    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', mime);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Local server running at http://localhost:${PORT}`);
  console.log(`Password protection active with ADMIN_PASSWORD from .env`);
});

