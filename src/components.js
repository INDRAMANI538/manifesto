// ============================================
// MANIFESTO — UI Components
// Reusable rendering functions
// ============================================

import { getStats, getWeekStats, getCategoryStats, getStreakDays, getLast7DaysActivity, getFocusStats, loadScratchpad } from './store.js';
import { getXP, getRankForXP, getNextRank } from './gamify.js';

// SVG Icons
const ICONS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
  halfCheck: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>',
  chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  close: '✕',
  drag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>',
};

const CATEGORIES = [
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'study', label: 'Study', emoji: '📚' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'personal', label: 'Personal', emoji: '🌟' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "The secret of getting ahead is getting started.",
  "What gets measured gets managed.",
  "Focus on being productive instead of busy.",
  "Don't count the days — make the days count.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Your future is created by what you do today, not tomorrow.",
];

function getCategoryEmoji(cat) {
  const found = CATEGORIES.find((c) => c.value === cat);
  return found ? found.emoji : '📌';
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return '🌙 Night Owl';
  if (h < 12) return '☀️ Good Morning';
  if (h < 17) return '🌤️ Good Afternoon';
  if (h < 21) return '🌆 Good Evening';
  return '🌙 Night Owl';
}

// ---- Hero Banner ----
export function renderHeroBanner(data) {
  const stats = getStats(data);
  const xp = getXP();
  const rank = getRankForXP(xp);
  const nextRank = getNextRank(rank.level);
  const xpProgress = nextRank ? Math.min(100, Math.round(((xp - rank.xpNeeded) / (nextRank.xpNeeded - rank.xpNeeded)) * 100)) : 100;
  const streak = getStreakDays();
  const quoteIdx = Math.floor(Date.now() / 86400000) % QUOTES.length;

  return `
    <div class="hero-top">
      <div class="hero-greeting">
        <div class="hero-time-row">
          <span class="hero-clock" id="hero-clock"></span>
          <span class="hero-date" id="hero-date"></span>
        </div>
        <h2 class="hero-title">${getTimeGreeting()}, Commander</h2>
      </div>
      <div class="hero-xp-area">
        <div class="hero-rank">
          <span class="hero-rank-icon">${rank.icon}</span>
          <span class="hero-rank-name">${rank.name}</span>
          <span class="hero-rank-level">Lv.${rank.level}</span>
        </div>
        <div class="hero-xp-bar-wrap">
          <div class="hero-xp-bar">
            <div class="hero-xp-fill" style="width: ${xpProgress}%"></div>
          </div>
          <span class="hero-xp-text">${xp}${nextRank ? ` / ${nextRank.xpNeeded} XP` : ' XP (MAX)'}</span>
        </div>
        ${streak > 0 ? `<div class="hero-streak">🔥 ${streak} day${streak !== 1 ? 's' : ''} streak</div>` : ''}
      </div>
    </div>
    <div class="hero-quote" id="hero-quote">
      <span class="hero-quote-text">"${QUOTES[quoteIdx]}"</span>
      <button class="hero-quote-shuffle" id="quote-shuffle-btn" title="New quote">🎲</button>
    </div>
    <div class="hero-actions">
      <button class="hero-action-pill" id="hero-add-goal" title="Add Goal">
        ${ICONS.plus} <span>Goal</span> <kbd>N</kbd>
      </button>
      <button class="hero-action-pill" id="hero-add-week" title="Add Week">
        📅 <span>Week</span> <kbd>W</kbd>
      </button>
      <button class="hero-action-pill" id="hero-focus" title="Focus Timer">
        ⏱️ <span>Focus</span> <kbd>F</kbd>
      </button>
      <button class="hero-action-pill" id="hero-typing" title="Speed Test">
        ⌨️ <span>Type</span> <kbd>T</kbd>
      </button>
    </div>
  `;
}

// ---- Dashboard Stats ----
export function renderDashboard(data) {
  const stats = getStats(data);
  return `
    <div class="stat-card" id="stat-total">
      <div class="stat-icon">🎯</div>
      <div class="stat-number" data-target="${stats.totalGoals}">0</div>
      <div class="stat-label">Total Goals</div>
    </div>
    <div class="stat-card" id="stat-done">
      <div class="stat-icon">✅</div>
      <div class="stat-number" data-target="${stats.doneGoals}">0</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card" id="stat-progress">
      <div class="stat-icon">⚡</div>
      <div class="stat-number" data-target="${stats.inProgressGoals}">0</div>
      <div class="stat-label">In Progress</div>
    </div>
    <div class="stat-card" id="stat-rate">
      <div class="stat-icon">📊</div>
      <div class="stat-number" data-target="${stats.completionRate}">0</div>
      <div class="stat-label">% Complete</div>
    </div>
    <div class="typing-card" id="typing-card">
      <div class="typing-card-left">
        <div class="typing-card-icon">⌨️</div>
        <div class="typing-card-info">
          <h3>Practice Typing</h3>
          <p>Take a break and sharpen your typing speed — MonkeyType style</p>
        </div>
      </div>
      <div class="typing-card-action">
        <span>Start Typing</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>
  `;
}

// ---- Week Navigator ----
export function renderWeekNavigator(data) {
  if (data.weeks.length === 0) return '';

  const tabs = data.weeks
    .map((week, idx) => {
      const stats = getWeekStats(week);
      const isActive = idx === data.currentWeekIndex;
      return `
      <div class="week-tab ${isActive ? 'active' : ''}" data-week-index="${idx}" data-week-id="${week.id}" id="week-tab-${week.id}">
        <button class="week-tab-delete" data-action="delete-week" data-week-id="${week.id}" title="Delete week">✕</button>
        <span class="week-tab-number">${week.label}</span>
        <span class="week-tab-count">${stats.total} goal${stats.total !== 1 ? 's' : ''}</span>
        <div class="week-tab-progress">
          <div class="week-tab-progress-fill" style="width: ${stats.progress}%"></div>
        </div>
      </div>
    `;
    })
    .join('');

  return `
    <div class="week-nav-header">
      <span class="week-nav-title">📅 Your Weeks</span>
      <div class="week-nav-controls">
        <button class="icon-btn" id="week-nav-left" aria-label="Scroll left">${ICONS.chevronLeft}</button>
        <button class="icon-btn" id="week-nav-right" aria-label="Scroll right">${ICONS.chevronRight}</button>
      </div>
    </div>
    <div class="week-nav-scroll" id="week-nav-scroll">
      ${tabs}
    </div>
  `;
}

// ---- Week Board ----
export function renderWeekBoard(data, currentView = 'list') {
  const week = data.weeks[data.currentWeekIndex];
  if (!week) return renderNoWeeksState();

  const stats = getWeekStats(week);
  const filter = data.settings?.filter || 'all';

  let filteredGoals = [...week.goals];
  if (filter !== 'all') {
    filteredGoals = filteredGoals.filter((g) => g.status === filter);
  }

  const goalCards = filteredGoals.length
    ? filteredGoals
      .map((goal, idx) => renderGoalCard(goal, week.id, idx))
      .join('')
    : renderEmptyGoals(filter);

  return `
    <div class="week-board-header">
      <div class="week-board-title-area">
        <input
          type="text"
          class="week-label-edit"
          value="${week.label}"
          data-week-id="${week.id}"
          id="week-label-input"
          spellcheck="false"
        />
        <span class="week-board-subtitle">${stats.total} goal${stats.total !== 1 ? 's' : ''} · ${stats.done} done</span>
      </div>
      <div class="week-board-actions">
        <div class="view-toggle" id="view-toggle">
          <button class="view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list" title="List View">📄</button>
          <button class="view-btn ${currentView === 'constellation' ? 'active' : ''}" data-view="constellation" title="Constellation View">🌌</button>
        </div>
        <button class="btn btn-primary" id="add-goal-btn" data-week-id="${week.id}">
          ${ICONS.plus}
          <span>Add Goal</span>
        </button>
      </div>
    </div>

    ${stats.total > 0 && currentView === 'list' ? `
    <div class="week-progress">
      <div class="week-progress-header">
        <span class="week-progress-label">Week Progress</span>
        <span class="week-progress-value">${stats.progress}%</span>
      </div>
      <div class="week-progress-bar">
        <div class="week-progress-fill" id="week-progress-fill" data-progress="${stats.progress}" style="width: 0%"></div>
      </div>
    </div>
    ` : ''}

    ${currentView === 'list' ? `
    <div class="filter-bar" id="filter-bar">
      <button class="filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-pill ${filter === 'todo' ? 'active' : ''}" data-filter="todo">To Do</button>
      <button class="filter-pill ${filter === 'in-progress' ? 'active' : ''}" data-filter="in-progress">In Progress</button>
      <button class="filter-pill ${filter === 'done' ? 'active' : ''}" data-filter="done">Done</button>
    </div>
    <div class="goals-list" id="goals-list">
      ${goalCards}
    </div>
    ` : `
    <div class="constellation-container" id="constellation-container"></div>
    `}
  `;
}

// ---- Goal Card ----
function renderGoalCard(goal, weekId, index) {
  const checkboxClass =
    goal.status === 'done'
      ? 'completed'
      : goal.status === 'in-progress'
        ? 'in-progress'
        : '';

  const checkboxIcon =
    goal.status === 'done'
      ? ICONS.check
      : goal.status === 'in-progress'
        ? ICONS.halfCheck
        : '';

  const isDone = goal.status === 'done';

  return `
    <div class="goal-card priority-${goal.priority} ${isDone ? 'done' : ''}"
         data-goal-id="${goal.id}"
         data-week-id="${weekId}"
         data-index="${index}"
         draggable="true"
         id="goal-${goal.id}">
      <div class="goal-card-top">
        <div class="goal-card-left">
          <button class="goal-checkbox ${checkboxClass}"
                  data-action="cycle-status"
                  data-goal-id="${goal.id}"
                  data-week-id="${weekId}"
                  title="Click to change status"
                  id="checkbox-${goal.id}">
            ${checkboxIcon}
          </button>
          <div class="goal-info">
            <div class="goal-title">${escapeHtml(goal.title)}</div>
            ${goal.description ? `<div class="goal-description">${escapeHtml(goal.description)}</div>` : ''}
            <div class="goal-meta">
              <span class="goal-badge badge-priority-${goal.priority}">${goal.priority}</span>
              <span class="goal-badge badge-cat-${goal.category}">${getCategoryEmoji(goal.category)} ${goal.category}</span>
              <span class="goal-badge badge-status-${goal.status}">${STATUS_LABELS[goal.status]}</span>
            </div>
          </div>
        </div>
        <div class="goal-actions">
          <button class="goal-action-btn" data-action="edit-goal" data-goal-id="${goal.id}" data-week-id="${weekId}" title="Edit" id="edit-${goal.id}">
            ${ICONS.edit}
          </button>
          <button class="goal-action-btn delete" data-action="delete-goal" data-goal-id="${goal.id}" data-week-id="${weekId}" title="Delete" id="delete-${goal.id}">
            ${ICONS.delete}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---- Sidebar Widgets ----
export function renderSidebarWidgets(data) {
  const focusStats = getFocusStats();
  const streak = getStreakDays();
  const last7 = getLast7DaysActivity();
  const scratchpad = loadScratchpad();
  const catStats = getCategoryStats(data);

  const catBars = CATEGORIES.filter(c => c.value !== 'other').map(c => {
    const stat = catStats[c.value] || { count: 0, percent: 0 };
    return `
      <div class="cat-bar-row">
        <span class="cat-bar-label">${c.emoji} ${c.label}</span>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width: ${stat.percent}%"></div>
        </div>
        <span class="cat-bar-value">${stat.count}</span>
      </div>
    `;
  }).join('');

  const heatmapDots = last7.map(d => {
    const level = d.count === 0 ? 0 : d.count <= 1 ? 1 : d.count <= 3 ? 2 : 3;
    return `<div class="heatmap-cell" title="${d.label}: ${d.count} completions">
      <div class="heatmap-dot level-${level}"></div>
      <span class="heatmap-label">${d.label}</span>
    </div>`;
  }).join('');

  return `
    <!-- Focus Timer -->
    <div class="sidebar-widget" id="focus-widget">
      <div class="widget-header">
        <span class="widget-title">⏱️ Focus Timer</span>
        <span class="widget-badge">${focusStats.sessions} sessions</span>
      </div>
      <div class="focus-presets" id="focus-presets">
        <button class="focus-preset active" data-minutes="25">25m</button>
        <button class="focus-preset" data-minutes="5">5m</button>
        <button class="focus-preset" data-minutes="15">15m</button>
      </div>
      <div class="focus-display" id="focus-display">25:00</div>
      <div class="focus-controls">
        <button class="btn btn-primary focus-btn" id="focus-start-btn">▶ Start</button>
        <button class="btn btn-secondary focus-btn" id="focus-reset-btn">↺ Reset</button>
        <button class="btn btn-ghost focus-btn" id="deep-space-btn" title="Enter Deep Space (Fullscreen)">🌌</button>
      </div>
    </div>

    <!-- Streak & Heatmap -->
    <div class="sidebar-widget" id="streak-widget">
      <div class="widget-header">
        <span class="widget-title">🔥 Habit Velocity</span>
        ${streak > 0 ? `<span class="widget-badge streak-badge">${streak} day${streak !== 1 ? 's' : ''} 🔥</span>` : ''}
      </div>
      <div class="heatmap-row">${heatmapDots}</div>
    </div>

    <!-- Typing Arcade -->
    <div class="sidebar-widget sidebar-widget-cta" id="typing-widget">
      <div class="widget-header">
        <span class="widget-title">⌨️ Typing Arcade</span>
      </div>
      <p class="widget-desc">Test your speed or learn touch typing</p>
      <div class="typing-widget-actions">
        <button class="btn btn-primary" id="sidebar-typing-btn">⌨️ Speed Test</button>
        <button class="btn btn-secondary" id="sidebar-learn-btn">🎓 Learn</button>
      </div>
      <button class="btn btn-ghost" id="sidebar-mp-btn" style="width: 100%; margin-top: var(--space-sm); border: 1px dashed var(--accent-cyan); color: var(--accent-cyan);">⚔️ 1v1 Arena</button>
      <button class="btn btn-ghost" id="sidebar-ttp-btn" style="width: 100%; margin-top: var(--space-sm); border: 1px dashed #4ade80; color: #4ade80; font-weight: 700;">💰 Type to Pay</button>
    </div>

    <!-- Scratchpad -->
    <div class="sidebar-widget" id="scratchpad-widget">
      <div class="widget-header">
        <span class="widget-title">📝 Scratchpad</span>
      </div>
      <textarea class="scratchpad-input" id="scratchpad-input" placeholder="Quick notes, ideas, brain dump...">${escapeHtml(scratchpad)}</textarea>
      <div class="scratchpad-actions">
        <button class="btn btn-ghost" id="scratchpad-to-goal" title="Convert to Goal">+ To Goal</button>
        <button class="btn btn-ghost" id="scratchpad-clear" title="Clear">Clear</button>
      </div>
    </div>

    <!-- Category Balance -->
    <div class="sidebar-widget" id="category-widget">
      <div class="widget-header">
        <span class="widget-title">📊 Category Balance</span>
      </div>
      <div class="cat-bars">${catBars}</div>
    </div>
  `;
}

// ---- Footer ----
export function renderFooter() {
  return `
    <div class="footer-inner">
      <div class="footer-left">
        <div class="footer-status">
          <span class="status-dot"></span>
          <span>100% Client-Side · LocalStorage Synced · Zero Latency</span>
        </div>
        <div class="footer-brand">MANIFESTO v2.0</div>
      </div>
      <div class="footer-center">
        <div class="footer-data-actions">
          <button class="btn btn-ghost" id="footer-export-btn">💾 Export</button>
          <button class="btn btn-ghost" id="footer-import-btn">📂 Import</button>
          <input type="file" id="import-file-input" accept=".json" style="display:none" />
        </div>
        <div class="footer-audio">
          <label class="audio-toggle-label">
            <input type="checkbox" id="audio-toggle" checked />
            <span>🔊 Audio</span>
          </label>
          <div class="audio-switches" id="audio-switches">
            <button class="audio-switch active" data-switch="thock">🐼 Thock</button>
            <button class="audio-switch" data-switch="clicky">⚡ Clicky</button>
            <button class="audio-switch" data-switch="cyber">🌌 Cyber</button>
          </div>
        </div>
      </div>
      <div class="footer-right">
        <div class="footer-hotkeys">
          <kbd>N</kbd> Goal
          <kbd>W</kbd> Week
          <kbd>/</kbd> Search
          <kbd>F</kbd> Focus
          <kbd>T</kbd> Type
          <kbd>Esc</kbd> Close
        </div>
      </div>
    </div>
  `;
}

// ---- Empty States ----
function renderEmptyGoals(filter) {
  if (filter !== 'all') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No ${STATUS_LABELS[filter] || ''} Goals</div>
        <div class="empty-state-text">No goals match the "${STATUS_LABELS[filter]}" filter. Try selecting a different filter or add new goals.</div>
      </div>
    `;
  }
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🎯</div>
      <div class="empty-state-title">No Goals Yet</div>
      <div class="empty-state-text">Start by adding your first goal for this week. Break down your ambitions into actionable steps!</div>
      <button class="btn btn-primary" id="add-goal-empty-btn">
        ${ICONS.plus}
        <span>Add Your First Goal</span>
      </button>
    </div>
  `;
}

function renderNoWeeksState() {
  return `
    <div class="no-weeks-state">
      <div class="no-weeks-icon">🚀</div>
      <div class="no-weeks-title">Your Journey Starts Here</div>
      <div class="no-weeks-text">
        Create your first week to begin planning your goals.
        Organize by weeks, track progress, and crush your ambitions one step at a time.
      </div>
      <button class="btn btn-primary" id="add-week-empty-btn">
        ${ICONS.plus}
        <span>Create Week 1</span>
      </button>
    </div>
  `;
}

// ---- Modals ----
export function renderGoalModal(weekId, existingGoal = null) {
  const isEdit = !!existingGoal;
  const title = isEdit ? 'Edit Goal' : 'Add New Goal';
  const submitLabel = isEdit ? 'Save Changes' : 'Add Goal';

  const catOptions = CATEGORIES.map(
    (c) =>
      `<option value="${c.value}" ${existingGoal?.category === c.value ? 'selected' : ''}>${c.emoji} ${c.label}</option>`
  ).join('');

  const priorityOptions = PRIORITIES.map(
    (p) =>
      `<option value="${p.value}" ${existingGoal?.priority === p.value ? 'selected' : ''}>${p.label}</option>`
  ).join('');

  return `
    <div class="modal-header">
      <h2 class="modal-title">${title}</h2>
      <button class="modal-close" id="modal-close-btn">${ICONS.close}</button>
    </div>
    <form id="goal-form" data-week-id="${weekId}" data-goal-id="${existingGoal?.id || ''}">
      <div class="form-group">
        <div class="form-label-row" style="display: flex; justify-content: space-between; align-items: center;">
          <label class="form-label" for="goal-title-input">Goal Title</label>
          ${!isEdit ? `<button type="button" class="btn btn-ghost" id="ai-breakdown-btn" style="padding: 2px 8px; font-size: 0.8rem;" title="AI Auto-Plan">✨ AI Auto-Plan</button>` : ''}
        </div>
        <input type="text" class="form-input" id="goal-title-input" name="title"
               placeholder="What do you want to achieve?"
               value="${escapeHtml(existingGoal?.title || '')}"
               required autocomplete="off" />
      </div>
      <div class="form-group">
        <label class="form-label" for="goal-desc-input">Description</label>
        <textarea class="form-textarea" id="goal-desc-input" name="description"
                  placeholder="Add some details...">${escapeHtml(existingGoal?.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="goal-priority-input">Priority</label>
          <select class="form-select" id="goal-priority-input" name="priority">
            ${priorityOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="goal-category-input">Category</label>
          <select class="form-select" id="goal-category-input" name="category">
            ${catOptions}
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary" id="goal-submit-btn">${submitLabel}</button>
      </div>
    </form>
  `;
}

export function renderConfirmModal(message, confirmLabel = 'Delete', confirmClass = 'btn-danger') {
  return `
    <div class="modal-header">
      <h2 class="modal-title">Confirm</h2>
      <button class="modal-close" id="modal-close-btn">${ICONS.close}</button>
    </div>
    <div class="confirm-content">
      <div class="confirm-icon">⚠️</div>
      <div class="confirm-text">${message}</div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn ${confirmClass}" id="confirm-action-btn">${confirmLabel}</button>
      </div>
    </div>
  `;
}

export function renderSettingsModal(currentApiKey) {
  return `
    <div class="modal-header">
      <h2 class="modal-title">Settings</h2>
      <button class="modal-close" id="modal-close-btn">${ICONS.close}</button>
    </div>
    <form id="settings-form">
      <div class="form-group">
        <label class="form-label" for="settings-api-key">Google Gemini API Key (Free)</label>
        <input type="password" class="form-input" id="settings-api-key" name="apiKey"
               placeholder="AIzaSy..." value="${escapeHtml(currentApiKey)}" autocomplete="off" />
        <div class="form-help" style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 6px;">
          Used for the AI Auto-Plan feature. Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: var(--accent-cyan);">Google AI Studio</a>. Saved securely on your device.
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary" id="settings-submit-btn">Save Settings</button>
      </div>
    </form>
  `;
}

// ---- Search Results ----
export function renderSearchResults(results) {
  if (results.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No Results</div>
        <div class="empty-state-text">No goals match your search. Try a different keyword.</div>
      </div>
    `;
  }

  const cards = results
    .map(
      (goal) => `
    <div class="goal-card priority-${goal.priority} ${goal.status === 'done' ? 'done' : ''}"
         data-goal-id="${goal.id}" data-week-id="${goal.weekId}">
      <div class="goal-card-top">
        <div class="goal-card-left">
          <div class="goal-info">
            <div class="goal-title">${escapeHtml(goal.title)}</div>
            ${goal.description ? `<div class="goal-description">${escapeHtml(goal.description)}</div>` : ''}
            <div class="goal-meta">
              <span class="goal-badge badge-priority-${goal.priority}">${goal.priority}</span>
              <span class="goal-badge badge-cat-${goal.category}">${getCategoryEmoji(goal.category)} ${goal.category}</span>
              <span class="goal-badge badge-status-${goal.status}">${STATUS_LABELS[goal.status]}</span>
              <span class="goal-badge" style="background: rgba(0,212,255,0.1); color: var(--accent-cyan);">📅 ${goal.weekLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div class="week-board-header">
      <div class="week-board-title-area">
        <h2 class="week-board-title">Search Results</h2>
        <span class="week-board-subtitle">${results.length} goal${results.length !== 1 ? 's' : ''} found</span>
      </div>
    </div>
    <div class="goals-list">${cards}</div>
  `;
}

// ---- Leaderboard ----
export function renderLeaderboardModal(topWpm, topXp, activeTab = 'wpm') {
  const isWpm = activeTab === 'wpm';
  
  const wpmRows = topWpm.map((u, i) => `
    <div class="lb-row ${i < 3 ? 'top-' + (i + 1) : ''}">
      <div class="lb-rank">#${i + 1}</div>
      <div class="lb-name">${escapeHtml(u.displayName || 'Anonymous')}</div>
      <div class="lb-score">${u.bestWpm} <span class="lb-label">WPM</span></div>
    </div>
  `).join('');

  const xpRows = topXp.map((u, i) => `
    <div class="lb-row ${i < 3 ? 'top-' + (i + 1) : ''}">
      <div class="lb-rank">#${i + 1}</div>
      <div class="lb-name">${escapeHtml(u.displayName || 'Anonymous')}</div>
      <div class="lb-score">${u.xp} <span class="lb-label">XP</span></div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <h2 class="modal-title">🏆 Global Leaderboard</h2>
      <button class="modal-close" id="modal-close-btn">${ICONS.close}</button>
    </div>
    <div class="lb-tabs">
      <button class="lb-tab ${isWpm ? 'active' : ''}" data-tab="wpm">⚡ Top Speeds</button>
      <button class="lb-tab ${!isWpm ? 'active' : ''}" data-tab="xp">👑 Top Ranks</button>
    </div>
    <div class="lb-content" id="lb-content-wpm" style="display: ${isWpm ? 'block' : 'none'};">
      ${topWpm.length > 0 ? wpmRows : '<div class="empty-state">No speed records yet.</div>'}
    </div>
    <div class="lb-content" id="lb-content-xp" style="display: ${!isWpm ? 'block' : 'none'};">
      ${topXp.length > 0 ? xpRows : '<div class="empty-state">No XP records yet.</div>'}
    </div>
  `;
}

// ---- Utilities ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
