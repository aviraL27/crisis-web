/**
 * ADMIN SCORE MANAGEMENT CONTROLLER (admin.html)
 * Password gate, serverless /api/verify validation, score editing & real-time sync
 */

const STORAGE_KEY = 'minimal_leaderboard_standings';
const AUTH_SESSION_KEY = 'admin_session_auth';

const state = {
  teams: [],
  searchQuery: '',
  editingTeamId: null,
  isAuthenticated: false
};

// ========================================================
// AUTHENTICATION GATE & API VERIFICATION
// ========================================================
function checkAuthStatus() {
  const isAuth = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  const gateEl = document.getElementById('auth-gate');
  const contentEl = document.getElementById('admin-content');

  if (isAuth) {
    state.isAuthenticated = true;
    if (gateEl) gateEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
    loadTeams();
    renderAdminTable();
  } else {
    state.isAuthenticated = false;
    if (gateEl) gateEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    const pwdInput = document.getElementById('admin-password-input');
    if (pwdInput) pwdInput.focus();
  }
}

// Cryptographic SHA-256 hash used exclusively when running via file:/// protocol (offline/no-server mode)
// The plaintext password remains strictly in .env and is never hardcoded
const FILE_PROTOCOL_HASH = '48cae8551383e434e97bdb4906954c97297bb8d2bfb2cc70cae398cb5230f847';

async function calculateSha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password) {
  const errorMsg = document.getElementById('auth-error-msg');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (errorMsg) errorMsg.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
  }

  const cleanPassword = (password || '').trim();

  try {
    // If user opened file:/// directly in browser, CORS blocks fetch('/api/verify').
    // Use cryptographic SHA-256 hash verification so double-clicking the HTML file works offline.
    if (window.location.protocol === 'file:') {
      const hash = await calculateSha256(cleanPassword);
      if (hash === FILE_PROTOCOL_HASH) {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
        checkAuthStatus();
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'Incorrect password. Access denied.';
          errorMsg.classList.remove('hidden');
        }
      }
      return;
    }

    // Standard HTTP/HTTPS mode (Vercel serverless function or local server)
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: cleanPassword })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      checkAuthStatus();
    } else {
      if (errorMsg) {
        errorMsg.textContent = data.error || 'Incorrect password. Access denied.';
        errorMsg.classList.remove('hidden');
      }
    }
  } catch (err) {
    // Fallback if fetch was blocked or server is offline
    const hash = await calculateSha256(cleanPassword);
    if (hash === FILE_PROTOCOL_HASH) {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      checkAuthStatus();
    } else {
      if (errorMsg) {
        errorMsg.textContent = 'Incorrect password. Access denied.';
        errorMsg.classList.remove('hidden');
      }
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock Console';
    }
  }
}

function lockConsole() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  const pwdInput = document.getElementById('admin-password-input');
  if (pwdInput) pwdInput.value = '';
  checkAuthStatus();
}

// ========================================================
// PERSISTENCE (LocalStorage)
// ========================================================
function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.teams = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed reading storage:', err);
    state.teams = [];
  }
}

function saveTeams() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.teams));
  } catch (err) {
    console.error('Failed writing storage:', err);
  }
}

// ========================================================
// SORTING & RENDERING (Operate Surface Mode)
// ========================================================
function getSortedTeams() {
  return [...state.teams].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function renderAdminTable() {
  if (!state.isAuthenticated) return;

  const sorted = getSortedTeams();
  const tbody = document.getElementById('admin-tbody');
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
        <span class="team-label">${escapeHtml(team.name)}</span>
      </td>
      <td class="col-points">
        <span class="points-value">${team.points.toLocaleString()}</span>
      </td>
      <td class="col-adjust">
        <div class="adjust-group" role="group" aria-label="Quick adjust points">
          <button type="button" class="btn-point" onclick="adjustPoints('${team.id}', 5)">+5</button>
          <button type="button" class="btn-point" onclick="adjustPoints('${team.id}', 10)">+10</button>
          <button type="button" class="btn-point" onclick="adjustPoints('${team.id}', 30)">+30</button>
          <button type="button" class="btn-point" onclick="adjustPoints('${team.id}', 50)">+50</button>
          <button type="button" class="btn-point neg" onclick="adjustPoints('${team.id}', -5)">-5</button>
        </div>
      </td>
      <td class="col-actions">
        <div class="row-actions">
          <button type="button" class="btn-action-icon" title="Edit score" aria-label="Edit score for ${escapeHtml(team.name)}" onclick="openEditModal('${team.id}')">✎</button>
          <button type="button" class="btn-action-icon" title="Delete team" aria-label="Delete team ${escapeHtml(team.name)}" onclick="deleteTeam('${team.id}')">✕</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ========================================================
// TEAM MANAGEMENT
// ========================================================
function addTeam(name, points) {
  const cleanName = name.trim();
  if (!cleanName) return false;

  const duplicate = state.teams.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
  if (duplicate) {
    alert(`A team named "${cleanName}" is already registered.`);
    return false;
  }

  const newTeam = {
    id: 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: cleanName,
    points: parseInt(points, 10) || 0,
    createdAt: Date.now()
  };

  state.teams.push(newTeam);
  saveTeams();
  renderAdminTable();
  return true;
}

function adjustPoints(teamId, delta) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return;

  team.points = Math.max(0, team.points + delta);
  saveTeams();
  renderAdminTable();
}

function deleteTeam(teamId) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return;

  if (confirm(`Remove "${team.name}" from the standings?`)) {
    state.teams = state.teams.filter(t => t.id !== teamId);
    saveTeams();
    renderAdminTable();
  }
}

function clearAllTeams() {
  if (state.teams.length === 0) return;
  if (confirm('Clear all teams and scores from the leaderboard?')) {
    state.teams = [];
    saveTeams();
    renderAdminTable();
  }
}

// ========================================================
// EXPORT TO CSV
// ========================================================
function exportToCSV() {
  if (state.teams.length === 0) {
    alert('No teams available to export.');
    return;
  }

  const sorted = getSortedTeams();
  let csv = 'Rank,Team Name,Points\n';
  sorted.forEach((team, idx) => {
    const escapedName = `"${team.name.replace(/"/g, '""')}"`;
    csv += `${idx + 1},${escapedName},${team.points}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ========================================================
// EDIT MODAL ACTIONS
// ========================================================
function openEditModal(teamId) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return;

  state.editingTeamId = teamId;
  const modal = document.getElementById('edit-modal');
  const teamNameEl = document.getElementById('modal-team-name');
  const pointsInput = document.getElementById('modal-points-input');

  if (teamNameEl) teamNameEl.textContent = team.name;
  if (pointsInput) pointsInput.value = team.points;

  if (modal) modal.classList.remove('hidden');
  if (pointsInput) pointsInput.focus();
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.add('hidden');
  state.editingTeamId = null;
}

function saveModalPoints() {
  if (!state.editingTeamId) return;
  const pointsInput = document.getElementById('modal-points-input');
  if (!pointsInput) return;

  const newPoints = parseInt(pointsInput.value, 10);
  if (isNaN(newPoints)) return;

  const team = state.teams.find(t => t.id === state.editingTeamId);
  if (team) {
    team.points = Math.max(0, newPoints);
    saveTeams();
    renderAdminTable();
  }

  closeEditModal();
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

// ========================================================
// INITIALIZATION
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check session authentication status immediately
  checkAuthStatus();

  // Auth Form Submit
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwdInput = document.getElementById('admin-password-input');
      if (pwdInput && pwdInput.value) {
        verifyPassword(pwdInput.value);
      }
    });
  }

  // Lock Button
  const lockBtn = document.getElementById('lock-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', lockConsole);
  }

  // Add Form Submit
  const addForm = document.getElementById('add-team-form');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('team-name-input');
      const pointsInput = document.getElementById('initial-points-input');

      if (!nameInput) return;
      const success = addTeam(nameInput.value, pointsInput ? pointsInput.value : 0);
      if (success) {
        nameInput.value = '';
        if (pointsInput) pointsInput.value = '0';
        nameInput.focus();
      }
    });
  }

  // Search Input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderAdminTable();
    });
  }

  // Clear All Button
  const resetBtn = document.getElementById('reset-all-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', clearAllTeams);
  }

  // Export CSV Button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }

  // Modal Handlers
  const modalClose = document.getElementById('modal-close-btn');
  const modalCancel = document.getElementById('modal-cancel-btn');
  const modalSave = document.getElementById('modal-save-btn');

  if (modalClose) modalClose.addEventListener('click', closeEditModal);
  if (modalCancel) modalCancel.addEventListener('click', closeEditModal);
  if (modalSave) modalSave.addEventListener('click', saveModalPoints);

  // Quick Chips inside Modal
  document.querySelectorAll('.delta-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const delta = parseInt(chip.dataset.delta, 10);
      const pointsInput = document.getElementById('modal-points-input');
      if (pointsInput && !isNaN(delta)) {
        const cur = parseInt(pointsInput.value, 10) || 0;
        pointsInput.value = Math.max(0, cur + delta);
      }
    });
  });

  // Modal Backdrop Click
  const modalOverlay = document.getElementById('edit-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeEditModal();
    });
  }

  // Keyboard Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditModal();
  });

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      if (state.isAuthenticated) {
        loadTeams();
        renderAdminTable();
      }
    }
  });
});
