// ============================================
// MANIFESTO — UI Components
// Reusable rendering functions
// ============================================

import { getStats, getWeekStats } from './store.js';

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

function getCategoryEmoji(cat) {
  const found = CATEGORIES.find((c) => c.value === cat);
  return found ? found.emoji : '📌';
}

// ---- Dashboard ----
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
export function renderWeekBoard(data) {
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
        <button class="btn btn-primary" id="add-goal-btn" data-week-id="${week.id}">
          ${ICONS.plus}
          <span>Add Goal</span>
        </button>
      </div>
    </div>

    ${stats.total > 0 ? `
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

    <div class="filter-bar" id="filter-bar">
      <button class="filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-pill ${filter === 'todo' ? 'active' : ''}" data-filter="todo">To Do</button>
      <button class="filter-pill ${filter === 'in-progress' ? 'active' : ''}" data-filter="in-progress">In Progress</button>
      <button class="filter-pill ${filter === 'done' ? 'active' : ''}" data-filter="done">Done</button>
    </div>

    <div class="goals-list" id="goals-list">
      ${goalCards}
    </div>
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
        <label class="form-label" for="goal-title-input">Goal Title</label>
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

// ---- Utilities ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
