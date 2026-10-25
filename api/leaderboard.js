// Vercel Serverless Function: api/leaderboard.js
// Handles shared leaderboard state across all devices and monitors

const fs = require('fs');
const path = require('path');

// In-memory fallback for serverless instances
let inMemoryTeams = null;

// Helper to interact with Vercel KV / Upstash Redis REST API
async function kvGet() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const res = await fetch(`${url}/get/crisis_leaderboard_teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        }
        return [];
      }
    } catch (e) {
      console.error('KV get error:', e);
    }
  }

  // Local file fallback (when running node server.js locally)
  const localFile = path.join(__dirname, '..', 'data', 'standings.json');
  if (fs.existsSync(localFile)) {
    try {
      const content = fs.readFileSync(localFile, 'utf8');
      return JSON.parse(content);
    } catch (e) {}
  }

  return inMemoryTeams || [];
}

async function kvSet(teams) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  inMemoryTeams = teams;

  let savedToCloud = false;

  if (url && token) {
    try {
      const res = await fetch(`${url}/set/crisis_leaderboard_teams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(teams))
      });
      if (res.ok) {
        savedToCloud = true;
      }
    } catch (e) {
      console.error('KV set error:', e);
    }
  }

  // Local file fallback
  const localDir = path.join(__dirname, '..', 'data');
  const localFile = path.join(localDir, 'standings.json');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(localFile, JSON.stringify(teams, null, 2), 'utf8');
  } catch (e) {}

  return savedToCloud;
}

module.exports = async (req, res) => {
  // CORS Headers for multi-device cross-origin support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Return shared leaderboard data to any device or projector
  if (req.method === 'GET') {
    const teams = await kvGet();
    const hasCloudKV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

    return res.status(200).json({
      success: true,
      teams: Array.isArray(teams) ? teams : [],
      storageMode: hasCloudKV ? 'vercel-kv' : 'local-or-memory',
      timestamp: Date.now()
    });
  }

  // POST: Update leaderboard data (requires authentication check)
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { teams } = body || {};

    if (!Array.isArray(teams)) {
      return res.status(400).json({ success: false, error: 'Invalid data format. Expected teams array.' });
    }

    const savedToCloud = await kvSet(teams);
    const hasCloudKV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

    return res.status(200).json({
      success: true,
      teams,
      savedToCloud,
      storageMode: hasCloudKV ? 'vercel-kv' : 'local-or-memory',
      timestamp: Date.now()
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
