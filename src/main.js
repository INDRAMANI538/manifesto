// ============================================
// MANIFESTO — Main App Entry
// Orchestrates rendering, events, auth, and state
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
  loadScratchpad,
  saveScratchpad,
  recordGoalCompletion,
  recordFocusSession,
  exportDataAsJSON,
  importDataFromJSON,
  setCurrentUID,
  loadAllFromCloud,
  pushAllToCloud,
  getApiKey,
  setApiKey,
  getTopWPM,
  getTopXP,
} from './store.js';
import {
  renderHeroBanner,
  renderDashboard,
  renderWeekNavigator,
  renderWeekBoard,
  renderSidebarWidgets,
  renderFooter,
  renderGoalModal,
  renderConfirmModal,
  renderSearchResults,
  renderSettingsModal,
  renderLeaderboardModal,
} from './components.js';
import { MultiplayerLobby, MultiplayerGame } from './multiplayer.js';
import {
  celebrateGoalComplete,
  animateCounter,
  animateProgressBar,
  showToast,
  pulseElement,
} from './animations.js';
import { playChimeSound, playSuccessSound, soundEngine } from './audio.js';
import { signUp, logIn, logOut, onAuthChange, getAuthErrorMessage } from './auth.js';
import { renderAuthPage } from './auth-page.js';
import { TypingTest } from './typing.js';
import { LearnTyping } from './learn.js';
import { TypeToPay } from './typetopay.js';
import { AdminDashboard, isAdmin } from './admin.js';
import { generateGoalBreakdown } from './ai.js';
import { ConstellationGraph } from './constellation.js';

// ---- State ----
let data = null;
let currentUser = null;
let searchMode = false;
let typingMode = false;
let typingTest = null;
let learnEngine = null;
let typeToPay = null;
let adminDashboard = null;
let dragState = { dragging: null, fromIndex: null };
let authMode = 'login';
let authError = '';
let authLoading = false;
let currentView = 'list'; // 'list' | 'constellation'
let constellationEngine = null;

// Omnibar State
let omnibarActive = false;
let omnibarResults = [];
let omnibarSelectedIndex = 0;

let mpLobby = null;
let mpGame = null;

// Focus Timer State
let focusTimer = {
  running: false,
  paused: false,
  interval: null,
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  presetMinutes: 25,
};

let clockInterval = null;

// ---- DOM References ----
const $authPage = () => document.getElementById('auth-page');
const $app = () => document.getElementById('app');
const $heroBanner = () => document.getElementById('hero-banner');
const $dashboard = () => document.getElementById('dashboard');
const $weekNav = () => document.getElementById('week-navigator');
const $weekBoard = () => document.getElementById('week-board');
const $sidebar = () => document.getElementById('sidebar');
const $footer = () => document.getElementById('app-footer');
const $modalOverlay = () => document.getElementById('modal-overlay');
const $modal = () => document.getElementById('modal');

// ============================================
// AUTH FLOW
// ============================================

function showAuthPage() {
  const authEl = $authPage();
  const appEl = $app();
  if (authEl) {
    authLoading = false;
    authError = '';
    authEl.classList.add('active');
    authEl.innerHTML = renderAuthPage(authMode, authError, authLoading);
  }
  if (appEl) appEl.classList.add('app-hidden');
}

function hideAuthPage() {
  const authEl = $authPage();
  const appEl = $app();
  if (authEl) {
    authEl.classList.remove('active');
    authEl.innerHTML = '';
  }
  if (appEl) appEl.classList.remove('app-hidden');
}

function rerenderAuthPage() {
  const authEl = $authPage();
  if (authEl && authEl.classList.contains('active')) {
    authEl.innerHTML = renderAuthPage(authMode, authError, authLoading);
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode;
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    authError = 'Please fill in all fields.';
    rerenderAuthPage();
    return;
  }

  if (mode === 'signup') {
    const confirm = form.passwordConfirm?.value;
    if (password !== confirm) {
      authError = 'Passwords do not match.';
      rerenderAuthPage();
      return;
    }
  }

  authError = '';
  authLoading = true;
  rerenderAuthPage();

  try {
    if (mode === 'signup') {
      await signUp(email, password);
    } else {
      await logIn(email, password);
    }
    authLoading = false;
    authError = '';
    // onAuthStateChanged will handle the rest
  } catch (err) {
    authLoading = false;
    authError = getAuthErrorMessage(err.code);
    rerenderAuthPage();
  }
}

async function handleLogout() {
  // Reset focus timer
  clearInterval(focusTimer.interval);
  focusTimer.running = false;
  focusTimer.paused = false;
  clearInterval(clockInterval);

  await logOut();
  // onAuthStateChanged will show auth page
}

// ============================================
// RENDER ENGINE
// ============================================

function renderAll() {
  renderHeroSection();
  renderDashboardSection();
  renderWeekNavSection();
  renderWeekBoardSection();
  renderSidebarSection();
  renderFooterSection();
  updateHeaderUser();
  startClock();
}

function updateHeaderUser() {
  const emailEl = document.getElementById('header-user-email');
  if (emailEl && currentUser) {
    emailEl.textContent = currentUser.email;
  }
}

function renderHeroSection() {
  const el = $heroBanner();
  if (!el) return;
  el.innerHTML = renderHeroBanner(data);
  updateClock();
}

function renderDashboardSection() {
  const el = $dashboard();
  if (!el) return;
  el.innerHTML = renderDashboard(data);

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
  if (searchMode) return;
  
  if (constellationEngine) {
    constellationEngine.destroy();
    constellationEngine = null;
  }
  
  el.innerHTML = renderWeekBoard(data, currentView);

  requestAnimationFrame(() => {
    if (currentView === 'list') {
      const progressFill = document.getElementById('week-progress-fill');
      if (progressFill) {
        const progress = parseInt(progressFill.dataset.progress, 10);
        animateProgressBar(progressFill, progress);
      }
    } else if (currentView === 'constellation') {
      const container = document.getElementById('constellation-container');
      const week = data.weeks[data.currentWeekIndex];
      if (container && week) {
        constellationEngine = new ConstellationGraph(container, week, (goalId) => {
          handleEditGoal(week.id, goalId);
        });
      }
    }
  });
}

function renderSidebarSection() {
  const el = $sidebar();
  if (!el) return;
  el.innerHTML = renderSidebarWidgets(data);
  updateFocusDisplay();
}

function renderFooterSection() {
  const el = $footer();
  if (!el) return;
  el.innerHTML = renderFooter();
}

// ---- Live Clock ----
function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
  const clockEl = document.getElementById('hero-clock');
  const dateEl = document.getElementById('hero-date');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
}

// ---- Focus Timer ----
function startFocusTimer() {
  if (focusTimer.running && !focusTimer.paused) {
    focusTimer.paused = true;
    clearInterval(focusTimer.interval);
    updateFocusButtonState();
    return;
  }

  if (focusTimer.paused) {
    focusTimer.paused = false;
  } else {
    focusTimer.remainingSeconds = focusTimer.totalSeconds;
  }

  focusTimer.running = true;
  focusTimer.interval = setInterval(() => {
    focusTimer.remainingSeconds--;
    updateFocusDisplay();

    if (focusTimer.remainingSeconds <= 0) {
      clearInterval(focusTimer.interval);
      focusTimer.running = false;
      focusTimer.paused = false;
      playChimeSound();
      recordFocusSession(focusTimer.presetMinutes);
      showToast(`🎉 Focus session complete! (${focusTimer.presetMinutes}m)`, 'success');
      focusTimer.remainingSeconds = focusTimer.totalSeconds;
      updateFocusDisplay();
      updateFocusButtonState();
      renderSidebarSection();
    }
  }, 1000);
  updateFocusButtonState();
}

function resetFocusTimer() {
  clearInterval(focusTimer.interval);
  focusTimer.running = false;
  focusTimer.paused = false;
  focusTimer.remainingSeconds = focusTimer.totalSeconds;
  updateFocusDisplay();
  updateFocusButtonState();
}

function setFocusPreset(minutes) {
  clearInterval(focusTimer.interval);
  focusTimer.running = false;
  focusTimer.paused = false;
  focusTimer.presetMinutes = minutes;
  focusTimer.totalSeconds = minutes * 60;
  focusTimer.remainingSeconds = minutes * 60;
  updateFocusDisplay();
  updateFocusButtonState();
}

function updateFocusDisplay() {
  const display = document.getElementById('focus-display');
  const dsTimer = document.getElementById('deep-space-timer');
  const mins = Math.floor(focusTimer.remainingSeconds / 60);
  const secs = focusTimer.remainingSeconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  if (display) {
    display.textContent = timeStr;
    display.classList.toggle('running', focusTimer.running && !focusTimer.paused);
  }
  if (dsTimer) {
    dsTimer.textContent = timeStr;
  }
}

function toggleDeepSpace() {
  const isDeepSpace = document.body.classList.toggle('deep-space-active');
  const dsTitle = document.getElementById('deep-space-title');
  if (isDeepSpace && dsTitle && data) {
    // Find first in-progress goal
    let activeGoal = null;
    if (data.weeks[data.currentWeekIndex]) {
      activeGoal = data.weeks[data.currentWeekIndex].goals.find(g => g.status === 'in-progress');
    }
    dsTitle.textContent = activeGoal ? activeGoal.title : 'Focusing...';
  }
}

function updateFocusButtonState() {
  const btn = document.getElementById('focus-start-btn');
  if (!btn) return;
  if (focusTimer.running && !focusTimer.paused) {
    btn.innerHTML = '⏸ Pause';
  } else if (focusTimer.paused) {
    btn.innerHTML = '▶ Resume';
  } else {
    btn.innerHTML = '▶ Start';
  }
}

// ---- Modal Management ----
function openModal(content) {
  const overlay = $modalOverlay();
  const modal = $modal();
  if (!overlay || !modal) return;
  modal.innerHTML = content;
  overlay.classList.add('active');
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
function handleAddWeek() {
  const newWeek = addWeek(data);
  showToast(`${newWeek.label} created!`, 'success');
  renderAll();
}

function handleDeleteWeek(weekId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  openModal(renderConfirmModal(`Delete <strong>${week.label}</strong> and all its goals?`, 'Delete Week', 'btn-danger'));
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

function handleWeekSelect(index) {
  data.currentWeekIndex = index;
  saveData(data);
  exitSearchMode();
  renderWeekNavSection();
  renderWeekBoardSection();
}

function handleAddGoal(weekId) {
  openModal(renderGoalModal(weekId));
}

async function handleAIBreakdown() {
  const titleInput = document.getElementById('goal-title-input');
  if (!titleInput || !titleInput.value.trim()) {
    showToast('Please enter a goal title first!', 'error');
    return;
  }

  const btn = document.getElementById('ai-breakdown-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '✨ Planning...';
  }

  try {
    const tasks = await generateGoalBreakdown(titleInput.value.trim());
    const weekId = document.getElementById('goal-form').dataset.weekId;
    
    tasks.forEach(task => {
      addGoal(data, weekId, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category
      });
    });

    closeModal();
    showToast('✨ AI successfully planned your goal!', 'success');
    renderAll();
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '✨ AI Auto-Plan';
    }
    if (err.message === 'API_KEY_MISSING') {
      showToast('Please set your Gemini API key in Settings first.', 'error');
      openModal(renderSettingsModal(''));
    } else if (err.message.startsWith('API_ERROR:')) {
      // Show the specific error message from the Gemini API
      showToast(`AI Failed: ${err.message.replace('API_ERROR: ', '')}`, 'error');
    } else {
      showToast('AI Breakdown failed. Check the console for details.', 'error');
    }
  }
}

function handleEditGoal(weekId, goalId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  const goal = week.goals.find((g) => g.id === goalId);
  if (!goal) return;
  openModal(renderGoalModal(weekId, goal));
}

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
    updateGoal(data, weekId, goalId, goalData);
    showToast('Goal updated!', 'success');
  } else {
    addGoal(data, weekId, goalData);
    showToast('Goal added!', 'success');
  }

  closeModal();
  renderAll();
}

function handleCycleStatus(weekId, goalId) {
  const newStatus = cycleGoalStatus(data, weekId, goalId);
  if (!newStatus) return;

  if (newStatus === 'done') {
    celebrateGoalComplete();
    playSuccessSound();
    recordGoalCompletion();
    showToast('Goal completed! 🎉', 'success');
  } else if (newStatus === 'in-progress') {
    showToast('Goal in progress ⚡', 'info');
  } else {
    showToast('Goal reset to todo', 'info');
  }

  renderAll();
}

function handleDeleteGoal(weekId, goalId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  const goal = week.goals.find((g) => g.id === goalId);
  if (!goal) return;
  openModal(renderConfirmModal(`Delete goal "<strong>${goal.title}</strong>"?`, 'Delete Goal', 'btn-danger'));
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

function handleFilter(filter) {
  data.settings.filter = filter;
  saveData(data);
  renderWeekBoardSection();
}

function handleWeekRename(weekId, newLabel) {
  renameWeek(data, weekId, newLabel);
  renderWeekNavSection();
}

function handleSearch(query) {
  const q = query.trim();
  if (!q) { exitSearchMode(); return; }
  searchMode = true;
  const results = searchGoals(data, q);
  const el = $weekBoard();
  if (el) el.innerHTML = renderSearchResults(results);
}

function exitSearchMode() {
  searchMode = false;
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const searchContainer = document.getElementById('search-container');
  if (searchContainer) searchContainer.classList.remove('active');
  renderWeekBoardSection();
}

// ---- Data Export/Import ----
function handleExport() {
  const json = exportDataAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manifesto-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported! 💾', 'success');
}

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const success = importDataFromJSON(e.target.result);
    if (success) {
      data = loadData();
      showToast('Data imported successfully! 🎉', 'success');
      renderAll();
    } else {
      showToast('Import failed — invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
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

    // === AUTH PAGE EVENTS ===
    if (target.closest('.auth-tab') || target.closest('.auth-switch')) {
      const el = target.closest('.auth-tab') || target.closest('.auth-switch');
      const mode = el.dataset.authMode;
      if (mode) {
        authMode = mode;
        authError = '';
        rerenderAuthPage();
      }
      return;
    }

    // === APP EVENTS ===
    // Settings
    if (target.closest('#settings-btn')) {
      openModal(renderSettingsModal(getApiKey()));
      return;
    }

    // Logout
    if (target.closest('#logout-btn')) {
      handleLogout();
      return;
    }

    // Typing card click
    if (target.closest('#typing-card') || target.closest('#sidebar-typing-btn')) {
      enterTypingMode();
      return;
    }

    if (target.closest('#sidebar-learn-btn')) {
      enterLearnMode();
      return;
    }

    // Hero quick actions
    if (target.closest('#hero-add-goal')) {
      const weekId = data.weeks[data.currentWeekIndex]?.id;
      if (weekId) handleAddGoal(weekId);
      else showToast('Create a week first!', 'info');
      return;
    }
    if (target.closest('#hero-add-week')) { handleAddWeek(); return; }
    if (target.closest('#hero-focus')) { startFocusTimer(); return; }
    if (target.closest('#hero-typing')) { enterTypingMode(); return; }

    // Quote shuffle
    if (target.closest('#quote-shuffle-btn')) {
      const quoteEl = document.querySelector('.hero-quote-text');
      if (quoteEl) {
        const quotes = [
          "Discipline is choosing between what you want now and what you want most.",
          "Small daily improvements are the key to staggering long-term results.",
          "The secret of getting ahead is getting started.",
          "What gets measured gets managed.",
          "Focus on being productive instead of busy.",
          "Don't count the days — make the days count.",
          "Success is the sum of small efforts repeated day in and day out.",
          "Your future is created by what you do today, not tomorrow.",
        ];
        quoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
      }
      return;
    }

    if (target.closest('#add-week-btn') || target.closest('#add-week-empty-btn')) { handleAddWeek(); return; }

    const weekTab = target.closest('.week-tab');
    if (weekTab && !target.closest('.week-tab-delete')) {
      handleWeekSelect(parseInt(weekTab.dataset.weekIndex, 10));
      pulseElement(weekTab);
      return;
    }

    if (target.closest('[data-action="delete-week"]')) {
      handleDeleteWeek(target.closest('[data-action="delete-week"]').dataset.weekId);
      return;
    }

    if (target.closest('#add-goal-btn') || target.closest('#add-goal-empty-btn')) {
      const weekId = target.closest('[data-week-id]')?.dataset.weekId || data.weeks[data.currentWeekIndex]?.id;
      if (weekId) handleAddGoal(weekId);
      return;
    }

    if (target.closest('[data-action="cycle-status"]')) {
      const btn = target.closest('[data-action="cycle-status"]');
      handleCycleStatus(btn.dataset.weekId, btn.dataset.goalId);
      pulseElement(btn);
      return;
    }

    if (target.closest('[data-action="edit-goal"]')) {
      const btn = target.closest('[data-action="edit-goal"]');
      handleEditGoal(btn.dataset.weekId, btn.dataset.goalId);
      return;
    }

    if (target.closest('[data-action="delete-goal"]')) {
      const btn = target.closest('[data-action="delete-goal"]');
      handleDeleteGoal(btn.dataset.weekId, btn.dataset.goalId);
      return;
    }

    if (target.closest('.filter-pill')) { handleFilter(target.closest('.filter-pill').dataset.filter); return; }
    
    if (target.closest('.view-btn')) {
      const btn = target.closest('.view-btn');
      currentView = btn.dataset.view;
      renderWeekBoardSection();
      return;
    }

    if (target.closest('#modal-close-btn') || target.closest('#modal-cancel-btn')) { closeModal(); return; }
    if (target.id === 'modal-overlay') { closeModal(); return; }

    if (target.closest('#search-toggle')) {
      const container = document.getElementById('search-container');
      if (container) {
        container.classList.toggle('active');
        if (container.classList.contains('active')) document.getElementById('search-input')?.focus();
        else exitSearchMode();
      }
      return;
    }

    if (target.closest('#week-nav-left')) { document.getElementById('week-nav-scroll')?.scrollBy({ left: -200, behavior: 'smooth' }); return; }
    if (target.closest('#week-nav-right')) { document.getElementById('week-nav-scroll')?.scrollBy({ left: 200, behavior: 'smooth' }); return; }

    if (target.closest('#focus-start-btn')) { startFocusTimer(); return; }
    if (target.closest('#focus-reset-btn')) { resetFocusTimer(); return; }
    if (target.closest('#deep-space-btn') || target.closest('#deep-space-exit')) { toggleDeepSpace(); return; }
    if (target.closest('#omnibar-overlay') && !target.closest('.omnibar')) { closeOmnibar(); return; }

    const omnibarItem = target.closest('.omnibar-result-item');
    if (omnibarItem) {
      executeOmnibarCommand(parseInt(omnibarItem.dataset.index, 10));
      return;
    }

    if (target.closest('.focus-preset')) {
      const preset = target.closest('.focus-preset');
      setFocusPreset(parseInt(preset.dataset.minutes, 10));
      document.querySelectorAll('.focus-preset').forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      return;
    }

    if (target.closest('#scratchpad-to-goal')) {
      const input = document.getElementById('scratchpad-input');
      if (input && input.value.trim()) {
        const weekId = data.weeks[data.currentWeekIndex]?.id;
        if (weekId) {
          addGoal(data, weekId, { title: input.value.trim(), priority: 'medium', category: 'other' });
          saveScratchpad('');
          input.value = '';
          showToast('Note converted to goal! 🎯', 'success');
          renderAll();
        } else { showToast('Create a week first!', 'info'); }
      }
      return;
    }
    if (target.closest('#scratchpad-clear')) {
      const input = document.getElementById('scratchpad-input');
      if (input) { input.value = ''; saveScratchpad(''); }
      return;
    }

    if (target.closest('#ai-breakdown-btn')) {
      handleAIBreakdown();
      return;
    }

    if (target.closest('#footer-export-btn')) { handleExport(); return; }
    if (target.closest('#footer-import-btn')) { document.getElementById('import-file-input')?.click(); return; }

    if (target.closest('.audio-switch')) {
      const switchBtn = target.closest('.audio-switch');
      soundEngine.switchType = switchBtn.dataset.switch;
      document.querySelectorAll('.audio-switch').forEach(s => s.classList.remove('active'));
      switchBtn.classList.add('active');
      soundEngine.playKeySound();
      return;
    }

    if (target.closest('#sidebar-mp-btn')) {
      enterMultiplayerMode();
      return;
    }

    if (target.closest('#sidebar-ttp-btn')) {
      enterTypeToPayMode();
      return;
    }

    if (target.closest('#sidebar-admin-btn')) {
      enterAdminMode();
      return;
    }
  });

  // Form submissions
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'auth-form') { handleAuthSubmit(e); return; }
    if (e.target.id === 'goal-form') { handleGoalFormSubmit(e); return; }
    if (e.target.id === 'settings-form') {
      e.preventDefault();
      setApiKey(e.target.apiKey.value);
      closeModal();
      showToast('Settings saved successfully', 'success');
    }
  });

  // Input events
  document.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') handleSearch(e.target.value);
    if (e.target.id === 'scratchpad-input') saveScratchpad(e.target.value);
    if (e.target.id === 'omnibar-input') updateOmnibarResults(e.target.value);
  });

  // Change events
  document.addEventListener('change', (e) => {
    if (e.target.id === 'week-label-input') handleWeekRename(e.target.dataset.weekId, e.target.value);
    if (e.target.id === 'audio-toggle') soundEngine.enabled = e.target.checked;
    if (e.target.id === 'import-file-input') {
      const file = e.target.files?.[0];
      if (file) handleImport(file);
      e.target.value = '';
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    // Omnibar Toggle (Cmd+K or Ctrl+K)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleOmnibar();
      return;
    }

    if (omnibarActive) {
      if (e.key === 'Escape') { closeOmnibar(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); selectOmnibarIndex(omnibarSelectedIndex + 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); selectOmnibarIndex(omnibarSelectedIndex - 1); return; }
      if (e.key === 'Enter') { e.preventDefault(); executeOmnibarCommand(omnibarSelectedIndex); return; }
      return;
    }

    if (e.target.id === 'week-label-input' && e.key === 'Enter') { e.target.blur(); }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') { closeModal(); exitSearchMode(); e.target.blur(); }
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'n': e.preventDefault(); { const wid = data?.weeks[data.currentWeekIndex]?.id; if (wid) handleAddGoal(wid); else showToast('Create a week first!', 'info'); } break;
      case 'w': e.preventDefault(); handleAddWeek(); break;
      case '/': e.preventDefault(); { const c = document.getElementById('search-container'); if (c) { c.classList.add('active'); document.getElementById('search-input')?.focus(); } } break;
      case 'f': e.preventDefault(); startFocusTimer(); break;
      case 't': e.preventDefault(); enterTypingMode(); break;
      case 'escape':
        closeModal();
        exitSearchMode();
        if (document.body.classList.contains('deep-space-active')) toggleDeepSpace();
        break;
    }
  });
}

// ============================================
// OMNIBAR LOGIC (PHASE 2)
// ============================================

function toggleOmnibar() {
  if (omnibarActive) closeOmnibar();
  else openOmnibar();
}

function openOmnibar() {
  if (!currentUser) return; // Must be logged in
  omnibarActive = true;
  document.getElementById('omnibar-overlay').classList.add('active');
  const input = document.getElementById('omnibar-input');
  input.value = '';
  input.focus();
  updateOmnibarResults('');
}

function closeOmnibar() {
  omnibarActive = false;
  document.getElementById('omnibar-overlay').classList.remove('active');
  document.getElementById('omnibar-input').blur();
}

function getOmnibarOptions(query) {
  const q = query.toLowerCase().trim();
  const options = [];
  
  // Static commands
  const staticCmds = [
    { title: 'New Goal', desc: 'Create a new goal in the current week', shortcut: 'N', icon: '🎯', action: () => { const wid = data?.weeks[data.currentWeekIndex]?.id; if (wid) handleAddGoal(wid); else showToast('Create a week first!', 'info'); } },
    { title: 'New Week', desc: 'Start a new week board', shortcut: 'W', icon: '📅', action: handleAddWeek },
    { title: 'Start Focus Timer', desc: 'Start or resume the focus timer', shortcut: 'F', icon: '⏱️', action: startFocusTimer },
    { title: 'Toggle Deep Space', desc: 'Enter immersive focus mode', icon: '🌌', action: toggleDeepSpace },
    { title: 'Arcade Mode', desc: 'Play the typing game', shortcut: 'T', icon: '⌨️', action: enterTypingMode },
    { title: 'Logout', desc: 'Sign out of your account', icon: '🚪', action: handleLogout },
  ];

  if (!q) return staticCmds;

  // Smart parsers
  if (q.startsWith('focus ') || q.startsWith('timer ')) {
    const min = parseInt(q.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(min) && min > 0) {
      options.push({ title: `Start ${min}m Focus Timer`, desc: 'Custom timer', icon: '⏳', action: () => { setFocusPreset(min); startFocusTimer(); } });
    }
  }

  if (q.startsWith('add ') || q.startsWith('goal ')) {
    const title = q.substring(4).trim();
    if (title) {
      options.push({
        title: `Add goal: "${title}"`, desc: 'Creates a new goal instantly', icon: '✨',
        action: () => {
          const weekId = data?.weeks[data.currentWeekIndex]?.id;
          if (weekId) { addGoal(data, weekId, { title, priority: 'medium', category: 'other' }); showToast('Goal added!', 'success'); renderAll(); }
          else showToast('Create a week first!', 'info');
        }
      });
    }
  }

  // Filter static
  options.push(...staticCmds.filter(c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)));
  
  // Search existing goals
  const searchRes = searchGoals(data, q);
  searchRes.slice(0, 5).forEach(g => {
    options.push({
      title: g.title, desc: `In ${g.weekLabel} • ${g.status}`, icon: '🔍',
      action: () => { handleEditGoal(g.weekId, g.id); }
    });
  });

  return options;
}

function updateOmnibarResults(query) {
  omnibarResults = getOmnibarOptions(query);
  omnibarSelectedIndex = 0;
  renderOmnibarResults();
}

function selectOmnibarIndex(index) {
  if (omnibarResults.length === 0) return;
  omnibarSelectedIndex = (index + omnibarResults.length) % omnibarResults.length;
  renderOmnibarResults();
}

function renderOmnibarResults() {
  const container = document.getElementById('omnibar-results');
  if (!container) return;
  
  if (omnibarResults.length === 0) {
    container.innerHTML = `<div class="omnibar-result-item" style="color: var(--text-tertiary); justify-content: center;">No results found</div>`;
    return;
  }

  container.innerHTML = omnibarResults.map((opt, i) => `
    <div class="omnibar-result-item ${i === omnibarSelectedIndex ? 'selected' : ''}" data-index="${i}">
      <div class="omnibar-result-icon">${opt.icon}</div>
      <div class="omnibar-result-text">
        <div class="omnibar-result-title">${opt.title}</div>
        <div class="omnibar-result-desc">${opt.desc}</div>
      </div>
      ${opt.shortcut ? `<div class="omnibar-result-shortcut">${opt.shortcut}</div>` : ''}
    </div>
  `).join('');

  // Scroll into view
  const selectedEl = container.querySelector('.selected');
  if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
}

function executeOmnibarCommand(index) {
  const opt = omnibarResults[index];
  if (opt && opt.action) {
    closeOmnibar();
    opt.action();
  }
}

// ---- Leaderboard ----
async function openLeaderboardModal(activeTab = 'wpm') {
  openModal('<div style="padding: 2rem; text-align: center;">Loading Leaderboard...</div>');
  const topWPM = await getTopWPM(10);
  const topXP = await getTopXP(10);
  openModal(renderLeaderboardModal(topWPM, topXP, activeTab));

  // Bind tab switching
  const modal = $modal();
  if (modal) {
    modal.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        openLeaderboardModal(tab);
      });
    });
  }
}

// Listen for leaderboard button click from typing component
window.addEventListener('manifesto-open-leaderboard', () => openLeaderboardModal('wpm'));

// ---- Typing Mode ----
function enterTypingMode() {
  if (learnEngine) { learnEngine.destroy(); learnEngine = null; }
  typingMode = true;
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = 'none';
  if (commandLayout) commandLayout.style.display = 'none';
  if (footer) footer.style.display = 'none';
  const app = document.getElementById('app');
  let typingContainer = document.getElementById('typing-container');
  if (!typingContainer) { typingContainer = document.createElement('section'); typingContainer.id = 'typing-container'; app.appendChild(typingContainer); }
  typingContainer.style.display = 'block';
  typingTest = new TypingTest(typingContainer);
  typingTest.onExit = exitTypingMode;
  typingTest.onLearn = enterLearnMode;
  typingTest.render();
}

function enterLearnMode() {
  if (typingTest) { typingTest.destroy(); typingTest = null; }
  typingMode = true;
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = 'none';
  if (commandLayout) commandLayout.style.display = 'none';
  if (footer) footer.style.display = 'none';
  const app = document.getElementById('app');
  let typingContainer = document.getElementById('typing-container');
  if (!typingContainer) { typingContainer = document.createElement('section'); typingContainer.id = 'typing-container'; app.appendChild(typingContainer); }
  typingContainer.style.display = 'block';
  learnEngine = new LearnTyping(typingContainer);
  learnEngine.onExit = exitTypingMode;
  learnEngine.render();
}

function exitTypingMode() {
  typingMode = false;
  if (typingTest) { typingTest.destroy(); typingTest = null; }
  if (learnEngine) { learnEngine.destroy(); learnEngine = null; }
  const typingContainer = document.getElementById('typing-container');
  if (typingContainer) typingContainer.style.display = 'none';
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = '';
  if (commandLayout) commandLayout.style.display = '';
  if (footer) footer.style.display = '';
  renderAll();
}

// ---- Multiplayer Mode ----
function enterMultiplayerMode() {
  if (!currentUser) {
    showToast('You must be logged in to play 1v1', 'error');
    return;
  }
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = 'none';
  if (commandLayout) commandLayout.style.display = 'none';
  if (footer) footer.style.display = 'none';
  
  const app = document.getElementById('app');
  let mpContainer = document.getElementById('mp-container');
  if (!mpContainer) { 
    mpContainer = document.createElement('section'); 
    mpContainer.id = 'mp-container'; 
    app.appendChild(mpContainer); 
  }
  mpContainer.style.display = 'block';
  
  mpLobby = new MultiplayerLobby(mpContainer);
  mpLobby.onExit = exitMultiplayerMode;
  mpLobby.onMatchStart = (matchData, isHost) => {
    mpLobby.destroy();
    mpLobby = null;
    mpGame = new MultiplayerGame(mpContainer, matchData, isHost);
    mpGame.onExit = exitMultiplayerMode;
    mpGame.render();
  };
  mpLobby.render();
}

function exitMultiplayerMode() {
  if (mpLobby) { mpLobby.destroy(); mpLobby = null; }
  if (mpGame) { mpGame.destroy(); mpGame = null; }
  const mpContainer = document.getElementById('mp-container');
  if (mpContainer) mpContainer.style.display = 'none';
  
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = '';
  if (commandLayout) commandLayout.style.display = '';
  if (footer) footer.style.display = '';
  renderAll();
}
// ---- Type to Pay Mode ----
function enterTypeToPayMode() {
  if (!currentUser) {
    showToast('You must be logged in to use Type to Pay', 'error');
    return;
  }
  if (typingTest) { typingTest.destroy(); typingTest = null; }
  if (learnEngine) { learnEngine.destroy(); learnEngine = null; }
  typingMode = true;
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = 'none';
  if (commandLayout) commandLayout.style.display = 'none';
  if (footer) footer.style.display = 'none';
  const app = document.getElementById('app');
  let ttpContainer = document.getElementById('ttp-main-container');
  if (!ttpContainer) {
    ttpContainer = document.createElement('section');
    ttpContainer.id = 'ttp-main-container';
    app.appendChild(ttpContainer);
  }
  ttpContainer.style.display = 'block';
  typeToPay = new TypeToPay(ttpContainer);
  typeToPay.onExit = exitTypeToPayMode;
  typeToPay.init();
}

function exitTypeToPayMode() {
  typingMode = false;
  if (typeToPay) { typeToPay.destroy(); typeToPay = null; }
  const ttpContainer = document.getElementById('ttp-main-container');
  if (ttpContainer) ttpContainer.style.display = 'none';
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = '';
  if (commandLayout) commandLayout.style.display = '';
  if (footer) footer.style.display = '';
  renderAll();
}

// ---- Admin Mode ----
function enterAdminMode() {
  if (!currentUser || !isAdmin(currentUser)) {
    showToast('Access denied', 'error');
    return;
  }
  
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = 'none';
  if (commandLayout) commandLayout.style.display = 'none';
  if (footer) footer.style.display = 'none';
  
  const app = document.getElementById('app');
  let adminContainer = document.getElementById('admin-main-container');
  if (!adminContainer) {
    adminContainer = document.createElement('section');
    adminContainer.id = 'admin-main-container';
    app.appendChild(adminContainer);
  }
  adminContainer.style.display = 'block';
  
  adminDashboard = new AdminDashboard(adminContainer);
  adminDashboard.onExit = exitAdminMode;
  adminDashboard.init();
}

function exitAdminMode() {
  if (adminDashboard) { adminDashboard.destroy(); adminDashboard = null; }
  const adminContainer = document.getElementById('admin-main-container');
  if (adminContainer) adminContainer.style.display = 'none';
  
  const heroBanner = $heroBanner();
  const commandLayout = document.getElementById('command-layout');
  const footer = $footer();
  if (heroBanner) heroBanner.style.display = '';
  if (commandLayout) commandLayout.style.display = '';
  if (footer) footer.style.display = '';
  renderAll();
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  console.log(
    '%c🚀 MANIFESTO',
    'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #00d4ff, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'
  );
  console.log('%cYour goal command center is ready.', 'color: #888; font-size: 12px;');

  setupEventDelegation();
  setupDragAndDrop();

  // Listen for auth state changes
  onAuthChange(async (user) => {
    if (user) {
      // User is logged in
      currentUser = user;
      setCurrentUID(user.uid);

      // Load data from Firestore (with localStorage fallback)
      const cloudData = await loadAllFromCloud();
      if (cloudData) {
        data = cloudData;
      } else {
        // First time — push any existing localStorage data to cloud
        data = loadData();
        await pushAllToCloud();
      }

      hideAuthPage();
      renderAll();
      showToast(`Welcome back! 👋`, 'success');
    } else {
      // User is logged out
      currentUser = null;
      data = null;
      setCurrentUID(null);
      showAuthPage();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
