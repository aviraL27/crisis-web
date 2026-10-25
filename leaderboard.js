/**
 * PUBLIC LIVE LEADERBOARD (index.html)
 * Real-time display for audience / projectors across ALL devices
 * Regularly fetches from /api/leaderboard to stay synchronized globally
 */

const STORAGE_KEY = 'minimal_leaderboard_standings';

const state = {
  teams: [],
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
      state.teams = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Local fallback read error:', err);
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
