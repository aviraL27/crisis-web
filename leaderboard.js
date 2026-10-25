/**
 * PUBLIC LIVE LEADERBOARD (index.html)
 * Real-time display for audience / projectors
 * Automatically syncs with admin changes across tabs
 */

const STORAGE_KEY = 'minimal_leaderboard_standings';

const state = {
  teams: [],
  searchQuery: ''
};

function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.teams = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading standings:', err);
    state.teams = [];
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
  loadTeams();
  renderPublicLeaderboard();

  // Search filter
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderPublicLeaderboard();
    });
  }

  // Cross-tab real-time sync via storage event
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      loadTeams();
      renderPublicLeaderboard();
    }
  });

  // Secondary polling sync (fallback for same-origin local window instances)
  setInterval(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const count = raw ? JSON.parse(raw).length : 0;
    const currentJson = JSON.stringify(state.teams);
    if (raw && raw !== currentJson) {
      loadTeams();
      renderPublicLeaderboard();
    } else if (!raw && state.teams.length > 0) {
      loadTeams();
      renderPublicLeaderboard();
    }
  }, 1000);
});

