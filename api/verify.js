// Vercel Serverless Function: api/verify.js
// Handles server-side password verification without exposing secrets to client

module.exports = (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const { password } = body || {};
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return res.status(500).json({
      success: false,
      error: 'ADMIN_PASSWORD environment variable is not configured on the server.'
    });
  }

  if (password && password.trim() === expectedPassword.trim()) {
    // Generate a simple auth token
    const token = Buffer.from(`auth_${Date.now()}_${Math.random()}`).toString('base64');
    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ success: false, error: 'Incorrect password' });
};

