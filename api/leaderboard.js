// Vercel Serverless Function: api/leaderboard.js
// Handles shared leaderboard state across all devices and monitors

const fs = require('fs');
const path = require('path');

// Initial default teams configured with 0 points (Excluding DeCoders)
const INITIAL_TEAMS = [
  { id: 't_01', name: 'slayers', points: 0, createdAt: 1000 },
  { id: 't_02', name: 'Code Bandits', points: 0, createdAt: 1001 },
  { id: 't_03', name: 'Midnight', points: 0, createdAt: 1002 },
  { id: 't_04', name: 'Outliers', points: 0, createdAt: 1003 },
  { id: 't_05', name: 'npm run away', points: 0, createdAt: 1004 },
  { id: 't_06', name: 'Dead_Pixel', points: 0, createdAt: 1005 },
  { id: 't_07', name: 'Jugaad.exe', points: 0, createdAt: 1006 },
  { id: 't_08', name: 'The Kestrels', points: 0, createdAt: 1007 },
  { id: 't_09', name: 'Bhooke Chole', points: 0, createdAt: 1008 },
  { id: 't_10', name: 'Techy Vibes', points: 0, createdAt: 1009 },
  { id: 't_11', name: 'LiteralNPCs', points: 0, createdAt: 1010 },
  { id: 't_12', name: 'Hard_Reset', points: 0, createdAt: 1011 },
  { id: 't_13', name: 'Kernel_4', points: 0, createdAt: 1012 },
  { id: 't_14', name: 'Dominators 6.0', points: 0, createdAt: 1013 },
  { id: 't_15', name: 'CodeWave', points: 0, createdAt: 1014 },
  { id: 't_16', name: 'Beginner', points: 0, createdAt: 1015 },
  { id: 't_17', name: 'Catalysts', points: 0, createdAt: 1016 },
  { id: 't_18', name: 'Mutexia', points: 0, createdAt: 1017 },
  { id: 't_19', name: 'ALPHA BLITZ', points: 0, createdAt: 1018 },
  { id: 't_20', name: 'ByteForge', points: 0, createdAt: 1019 },
  { id: 't_21', name: 'Halwa Puri', points: 0, createdAt: 1020 },
  { id: 't_22', name: 'OverRaged_Gods', points: 0, createdAt: 1021 },
  { id: 't_23', name: 'NexGen', points: 0, createdAt: 1022 },
  { id: 't_24', name: 'Bermuda Triangle', points: 0, createdAt: 1023 },
  { id: 't_25', name: 'Grey Ninja', points: 0, createdAt: 1024 },
  { id: 't_26', name: 'HackoRuv', points: 0, createdAt: 1025 },
  { id: 't_27', name: 'Decodes', points: 0, createdAt: 1026 },
  { id: 't_28', name: 'Outliers 2', points: 0, createdAt: 1027 },
  { id: 't_29', name: 'Meowl-Devs', points: 0, createdAt: 1028 },
  { id: 't_30', name: 'The Can-Do Crew', points: 0, createdAt: 1029 },
  { id: 't_31', name: 'Black_Currant', points: 0, createdAt: 1030 },
  { id: 't_32', name: 'Obsidian', points: 0, createdAt: 1031 },
  { id: 't_33', name: 'Team Brahmastra', points: 0, createdAt: 1032 },
  { id: 't_34', name: 'Obscyra_ra', points: 0, createdAt: 1033 },
  { id: 't_35', name: '4STARS', points: 0, createdAt: 1034 },
  { id: 't_36', name: 'Smashers', points: 0, createdAt: 1035 },
  { id: 't_37', name: 'INNOVARE', points: 0, createdAt: 1036 },
  { id: 't_38', name: 'Team Allies', points: 0, createdAt: 1037 },
  { id: 't_39', name: 'Incepta', points: 0, createdAt: 1038 },
  { id: 't_40', name: 'Commit & Run', points: 0, createdAt: 1039 },
  { id: 't_41', name: 'team_name', points: 0, createdAt: 1040 },
  { id: 't_42', name: 'Akatsuki', points: 0, createdAt: 1041 },
  { id: 't_43', name: '100X', points: 0, createdAt: 1042 },
  { id: 't_44', name: 'The Debuggers', points: 0, createdAt: 1043 }
];

// In-memory cache
let inMemoryTeams = null;

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
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('KV get error:', e);
    }
  }

  // Local file fallback
  const localFile = path.join(__dirname, '..', 'data', 'standings.json');
  if (fs.existsSync(localFile)) {
    try {
      const content = fs.readFileSync(localFile, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  return inMemoryTeams || INITIAL_TEAMS;
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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const teams = await kvGet();
    const hasCloudKV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

    return res.status(200).json({
      success: true,
      teams: Array.isArray(teams) ? teams : INITIAL_TEAMS,
      storageMode: hasCloudKV ? 'vercel-kv' : 'local-or-memory',
      timestamp: Date.now()
    });
  }

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
