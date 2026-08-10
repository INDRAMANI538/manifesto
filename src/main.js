// ============================================
// MANIFESTO — Main App Entry
// Orchestrates rendering, events, and state
// ============================================

import './style.css';
import {
  loadData,
  saveData,
  addWeek,
  deleteWeek,
  renameWeek,
  addGoal,
  updateGoal,
  deleteGoal,
  cycleGoalStatus,
  reorderGoals,
  searchGoals,
} from './store.js';
import {
  renderDashboard,
  renderWeekNavigator,
  renderWeekBoard,
  renderGoalModal,
  renderConfirmModal,
  renderSearchResults,
} from './components.js';
import {
  celebrateGoalComplete,
  animateCounter,
  animateProgressBar,
  showToast,
  pulseElement,
} from './animations.js';
import { TypingTest } from './typing.js';
import { LearnTyping } from './learn.js';

// ---- State ----
let data = loadData();
let searchMode = false;
let typingMode = false;
let typingTest = null;
let learnEngine = null;
let dragState = { dragging: null, fromIndex: null };

// ---- DOM References ----
const $dashboard = () => document.getElementById('dashboard');
const $weekNav = () => document.getElementById('week-navigator');
const $weekBoard = () => document.getElementById('week-board');
const $modalOverlay = () => document.getElementById('modal-overlay');
const $modal = () => document.getElementById('modal');

// ---- Render Engine ----
function renderAll() {
  renderDashboardSection();
  renderWeekNavSection();
  renderWeekBoardSection();
}

function renderDashboardSection() {
  const el = $dashboard();
  if (!el) return;
  el.innerHTML = renderDashboard(data);

  // Animate counters
  requestAnimationFrame(() => {
    el.querySelectorAll('.stat-number').forEach((counter) => {
      const target = parseInt(counter.dataset.target, 10);
      animateCounter(counter, target, 800);
    });
  });
}

function renderWeekNavSection() {
  const el = $weekNav();
  if (!el) return;
  el.innerHTML = renderWeekNavigator(data);

  // Scroll active tab into view
  requestAnimationFrame(() => {
    const activeTab = el.querySelector('.week-tab.active');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
}

function renderWeekBoardSection() {
  const el = $weekBoard();
  if (!el) return;

  if (searchMode) return; // Don't override search results

  el.innerHTML = renderWeekBoard(data);

  // Animate progress bar
  requestAnimationFrame(() => {
    const progressFill = document.getElementById('week-progress-fill');
    if (progressFill) {
      const progress = parseInt(progressFill.dataset.progress, 10);
      animateProgressBar(progressFill, progress);
    }
  });
}

// ---- Modal Management ----
function openModal(content) {
  const overlay = $modalOverlay();
  const modal = $modal();
  if (!overlay || !modal) return;
  modal.innerHTML = content;
  overlay.classList.add('active');
  // Focus first input
  requestAnimationFrame(() => {
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
  });
}

function closeModal() {
  const overlay = $modalOverlay();
  if (overlay) overlay.classList.remove('active');
}

// ---- Event Handlers ----

// Add Week
function handleAddWeek() {
  const newWeek = addWeek(data);
  showToast(`${newWeek.label} created!`, 'success');
  renderAll();
}

// Delete Week
function handleDeleteWeek(weekId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;

  openModal(
    renderConfirmModal(
      `Delete <strong>${week.label}</strong> and all its goals? This cannot be undone.`,
      'Delete Week',
      'btn-danger'
    )
  );

  // Attach confirm handler
  setTimeout(() => {
    const confirmBtn = document.getElementById('confirm-action-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        deleteWeek(data, weekId);
        closeModal();
        showToast(`${week.label} deleted`, 'info');
        renderAll();
      });
    }
  }, 50);
}

// Navigate Weeks
function handleWeekSelect(index) {
  data.currentWeekIndex = index;
  saveData(data);
  exitSearchMode();
  renderWeekNavSection();
  renderWeekBoardSection();
}

// Add Goal
function handleAddGoal(weekId) {
  openModal(renderGoalModal(weekId));
}

// Edit Goal
function handleEditGoal(weekId, goalId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  const goal = week.goals.find((g) => g.id === goalId);
  if (!goal) return;
  openModal(renderGoalModal(weekId, goal));
}

// Submit Goal Form
function handleGoalFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const weekId = form.dataset.weekId;
  const goalId = form.dataset.goalId;

  const goalData = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    priority: form.priority.value,
    category: form.category.value,
  };

  if (!goalData.title) {
    showToast('Goal title is required!', 'error');
    return;
  }

  if (goalId) {
    // Edit
    updateGoal(data, weekId, goalId, goalData);
    showToast('Goal updated!', 'success');
  } else {
    // Add
    addGoal(data, weekId, goalData);
    showToast('Goal added!', 'success');
  }

  closeModal();
  renderAll();
}

// Cycle Goal Status
function handleCycleStatus(weekId, goalId) {
  const newStatus = cycleGoalStatus(data, weekId, goalId);
  if (!newStatus) return;

  if (newStatus === 'done') {
    celebrateGoalComplete();
    showToast('Goal completed! 🎉', 'success');
  } else if (newStatus === 'in-progress') {
    showToast('Goal in progress ⚡', 'info');
  } else {
    showToast('Goal reset to todo', 'info');
  }

  renderAll();
}

// Delete Goal
function handleDeleteGoal(weekId, goalId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  const goal = week.goals.find((g) => g.id === goalId);
  if (!goal) return;

  openModal(
    renderConfirmModal(
      `Delete goal "<strong>${goal.title}</strong>"? This cannot be undone.`,
      'Delete Goal',
      'btn-danger'
    )
  );

  setTimeout(() => {
    const confirmBtn = document.getElementById('confirm-action-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        deleteGoal(data, weekId, goalId);
        closeModal();
        showToast('Goal deleted', 'info');
        renderAll();
      });
    }
  }, 50);
}

// Filter
function handleFilter(filter) {
  data.settings.filter = filter;
  saveData(data);
  renderWeekBoardSection();
}

// Rename Week
function handleWeekRename(weekId, newLabel) {
  renameWeek(data, weekId, newLabel);
  renderWeekNavSection();
}

// Search
function handleSearch(query) {
  const q = query.trim();
  if (!q) {
    exitSearchMode();
    return;
  }

  searchMode = true;
  const results = searchGoals(data, q);
  const el = $weekBoard();
  if (el) {
    el.innerHTML = renderSearchResults(results);
  }
}

function exitSearchMode() {
  searchMode = false;
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const searchContainer = document.getElementById('search-container');
  if (searchContainer) searchContainer.classList.remove('active');
  renderWeekBoardSection();
}

// ---- Drag & Drop ----
function setupDragAndDrop() {
  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.goal-card');
    if (!card) return;
    dragState.dragging = card;
    dragState.fromIndex = parseInt(card.dataset.index, 10);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.goal-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    dragState = { dragging: null, fromIndex: null };
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    const card = e.target.closest('.goal-card');
    if (!card || card === dragState.dragging) return;
    card.classList.add('drag-over');
  });

  document.addEventListener('dragleave', (e) => {
    const card = e.target.closest('.goal-card');
    if (card) card.classList.remove('drag-over');
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetCard = e.target.closest('.goal-card');
    if (!targetCard || !dragState.dragging) return;

    const weekId = targetCard.dataset.weekId;
    const toIndex = parseInt(targetCard.dataset.index, 10);
    const fromIndex = dragState.fromIndex;

    if (fromIndex !== toIndex) {
      reorderGoals(data, weekId, fromIndex, toIndex);
      renderWeekBoardSection();
      showToast('Goals reordered', 'info');
    }

    targetCard.classList.remove('drag-over');
  });
}

// ---- Event Delegation ----
function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    const target = e.target;

    // Typing card click
    if (target.closest('#typing-card')) {
      enterTypingMode();
      return;
    }

    // Add Week button(s)
    if (target.closest('#add-week-btn') || target.closest('#add-week-empty-btn')) {
      handleAddWeek();
      return;
    }

    // Week tab click
    const weekTab = target.closest('.week-tab');
    if (weekTab && !target.closest('.week-tab-delete')) {
      const index = parseInt(weekTab.dataset.weekIndex, 10);
      handleWeekSelect(index);
      pulseElement(weekTab);
      return;
    }

    // Delete Week
    if (target.closest('[data-action="delete-week"]')) {
      const btn = target.closest('[data-action="delete-week"]');
      handleDeleteWeek(btn.dataset.weekId);
      return;
    }

    // Add Goal button(s)
    if (target.closest('#add-goal-btn') || target.closest('#add-goal-empty-btn')) {
      const weekId = target.closest('[data-week-id]')?.dataset.weekId ||
                     data.weeks[data.currentWeekIndex]?.id;
      if (weekId) handleAddGoal(weekId);
      return;
    }

    // Cycle Status (checkbox click)
    if (target.closest('[data-action="cycle-status"]')) {
      const btn = target.closest('[data-action="cycle-status"]');
      handleCycleStatus(btn.dataset.weekId, btn.dataset.goalId);
      pulseElement(btn);
      return;
    }

    // Edit Goal
    if (target.closest('[data-action="edit-goal"]')) {
      const btn = target.closest('[data-action="edit-goal"]');
      handleEditGoal(btn.dataset.weekId, btn.dataset.goalId);
      return;
    }

    // Delete Goal
    if (target.closest('[data-action="delete-goal"]')) {
      const btn = target.closest('[data-action="delete-goal"]');
      handleDeleteGoal(btn.dataset.weekId, btn.dataset.goalId);
      return;
    }

    // Filter pills
    if (target.closest('.filter-pill')) {
      const pill = target.closest('.filter-pill');
      handleFilter(pill.dataset.filter);
      return;
    }

    // Modal close
    if (target.closest('#modal-close-btn') || target.closest('#modal-cancel-btn')) {
      closeModal();
      return;
    }

    // Modal overlay click (close if clicking outside)
    if (target.id === 'modal-overlay') {
      closeModal();
      return;
    }

    // Search toggle
    if (target.closest('#search-toggle')) {
      const container = document.getElementById('search-container');
      if (container) {
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
          document.getElementById('search-input')?.focus();
        } else {
          exitSearchMode();
        }
      }
      return;
    }

    // Week nav scroll buttons
    if (target.closest('#week-nav-left')) {
      const scroll = document.getElementById('week-nav-scroll');
      if (scroll) scroll.scrollBy({ left: -200, behavior: 'smooth' });
      return;
    }
    if (target.closest('#week-nav-right')) {
      const scroll = document.getElementById('week-nav-scroll');
      if (scroll) scroll.scrollBy({ left: 200, behavior: 'smooth' });
      return;
    }
  });

  // Form submissions
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'goal-form') {
      handleGoalFormSubmit(e);
    }
  });

  // Search input
  document.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') {
      handleSearch(e.target.value);
    }
  });

  // Week label rename (blur)
  document.addEventListener('change', (e) => {
    if (e.target.id === 'week-label-input') {
      handleWeekRename(e.target.dataset.weekId, e.target.value);
    }
  });

  // Enter key on week label
  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'week-label-input' && e.key === 'Enter') {
      e.target.blur();
    }
    // Escape to close modal
    if (e.key === 'Escape') {
      closeModal();
      exitSearchMode();
    }
  });
}

// ---- Typing Mode ----
function enterTypingMode() {
  if (learnEngine) {
    learnEngine.destroy();
    learnEngine = null;
  }
  typingMode = true;

  // Hide main sections
  const dashboard = $dashboard();
  const weekNav = $weekNav();
  const weekBoard = $weekBoard();

  if (dashboard) dashboard.style.display = 'none';
  if (weekNav) weekNav.style.display = 'none';
  if (weekBoard) weekBoard.style.display = 'none';

  // Create typing container or use week-board
  const appMain = document.getElementById('app-main');
  let typingContainer = document.getElementById('typing-container');
  if (!typingContainer) {
    typingContainer = document.createElement('section');
    typingContainer.id = 'typing-container';
    appMain.appendChild(typingContainer);
  }
  typingContainer.style.display = 'block';

  // Initialize typing test
  typingTest = new TypingTest(typingContainer);
  typingTest.onExit = exitTypingMode;
  typingTest.onLearn = enterLearnMode;
  typingTest.render();
}

function enterLearnMode() {
  if (typingTest) {
    typingTest.destroy();
    typingTest = null;
  }
  typingMode = true;

  const dashboard = $dashboard();
  const weekNav = $weekNav();
  const weekBoard = $weekBoard();

  if (dashboard) dashboard.style.display = 'none';
  if (weekNav) weekNav.style.display = 'none';
  if (weekBoard) weekBoard.style.display = 'none';

  const appMain = document.getElementById('app-main');
  let typingContainer = document.getElementById('typing-container');
  if (!typingContainer) {
    typingContainer = document.createElement('section');
    typingContainer.id = 'typing-container';
    appMain.appendChild(typingContainer);
  }
  typingContainer.style.display = 'block';

  learnEngine = new LearnTyping(typingContainer);
  learnEngine.onExit = exitTypingMode;
  learnEngine.render();
}

function exitTypingMode() {
  typingMode = false;
  if (typingTest) {
    typingTest.destroy();
    typingTest = null;
  }
  if (learnEngine) {
    learnEngine.destroy();
    learnEngine = null;
  }

  // Clean up typing container
  const typingContainer = document.getElementById('typing-container');
  if (typingContainer) typingContainer.style.display = 'none';

  // Show main sections
  const dashboard = $dashboard();
  const weekNav = $weekNav();
  const weekBoard = $weekBoard();

  if (dashboard) dashboard.style.display = '';
  if (weekNav) weekNav.style.display = '';
  if (weekBoard) weekBoard.style.display = '';

  // Re-render
  renderAll();
}

// ---- Initialize ----
function init() {
  console.log(
    '%c🚀 MANIFESTO',
    'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #00d4ff, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'
  );
  console.log('%cYour goal command center is ready.', 'color: #888; font-size: 12px;');

  renderAll();
  setupEventDelegation();
  setupDragAndDrop();
}

// Start
document.addEventListener('DOMContentLoaded', init);
