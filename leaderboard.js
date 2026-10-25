/**
 * PUBLIC LIVE LEADERBOARD (index.html)
 * Real-time display for audience / projectors across ALL devices
 * Regularly fetches from /api/leaderboard to stay synchronized globally
 */

const STORAGE_KEY = 'minimal_leaderboard_standings';

// Default 44 teams with 0 points (Excluding DeCoders)
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

const state = {
  teams: INITIAL_TEAMS,
  searchQuery: '',
  lastServerTimestamp: 0
};

// Fetch shared standings from server
async function fetchServerStandings() {
  if (window.location.protocol === 'file:') {
    loadLocalFallback();
    renderPublicLeaderboard();
    return;
  }

  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.teams)) {
        // Compare with current state to avoid unnecessary DOM thrashing
        const newJson = JSON.stringify(data.teams);
        const currentJson = JSON.stringify(state.teams);
        if (newJson !== currentJson) {
          state.teams = data.teams;
          // Keep local storage synced as cache
          try { localStorage.setItem(STORAGE_KEY, newJson); } catch (e) {}
          renderPublicLeaderboard();
        }
      }
    } else {
      loadLocalFallback();
      renderPublicLeaderboard();
    }
  } catch (err) {
    loadLocalFallback();
    renderPublicLeaderboard();
  }
}

function loadLocalFallback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.teams = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEAMS;
    } else {
      state.teams = INITIAL_TEAMS;
    }
  } catch (err) {
    state.teams = INITIAL_TEAMS;
  }
}

function getSortedTeams() {
  return [...state.teams].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function renderPublicLeaderboard() {
  const sorted = getSortedTeams();
  const tbody = document.getElementById('public-leaderboard-tbody');
  const emptyState = document.getElementById('empty-state');
  const teamsCount = document.getElementById('teams-count');

  const query = state.searchQuery.toLowerCase().trim();
  const filtered = sorted.filter(t => query === '' || t.name.toLowerCase().includes(query));

  if (teamsCount) {
    teamsCount.textContent = `${state.teams.length} ${state.teams.length === 1 ? 'team' : 'teams'}`;
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  filtered.forEach(team => {
    const overallRank = sorted.findIndex(t => t.id === team.id) + 1;

    let rankModifier = '';
    if (overallRank === 1) rankModifier = 'leader';
    else if (overallRank === 2 || overallRank === 3) rankModifier = 'runner-up';

    const tr = document.createElement('tr');
    tr.dataset.teamId = team.id;

    tr.innerHTML = `
      <td class="col-rank">
        <span class="rank-box ${rankModifier}">${overallRank}</span>
      </td>
      <td class="col-team">
        <span class="team-label public-team-title">${escapeHtml(team.name)}</span>
      </td>
      <td class="col-points-public">
        <span class="points-value public-points-display">${team.points.toLocaleString()}</span>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial load from cache then server
  loadLocalFallback();
  renderPublicLeaderboard();
  fetchServerStandings();

  // Search filter
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderPublicLeaderboard();
    });
  }

  // Cross-device live sync: Poll server every 2 seconds
  setInterval(fetchServerStandings, 2000);

  // Same-device instant tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      loadLocalFallback();
      renderPublicLeaderboard();
    }
  });
});
