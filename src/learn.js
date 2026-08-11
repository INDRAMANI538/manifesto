// ============================================
// MANIFESTO — Learn Touch Typing
// Progressive module-based touch typing tutor
// with visual keyboard, hand guides & AI prompts
// ============================================

import { soundEngine } from './audio.js';
import { spawnParticleBurst, showComboToast, shakeElement } from './effects.js';
import { addXP } from './gamify.js';

// ---- Finger → Key mapping (QWERTY) ----
const FINGER_MAP = {
  // Left hand
  'q': 'l-pinky', 'a': 'l-pinky', 'z': 'l-pinky',
  'w': 'l-ring', 's': 'l-ring', 'x': 'l-ring',
  'e': 'l-middle', 'd': 'l-middle', 'c': 'l-middle',
  'r': 'l-index', 'f': 'l-index', 'v': 'l-index',
  't': 'l-index', 'g': 'l-index', 'b': 'l-index',
  // Right hand
  'y': 'r-index', 'h': 'r-index', 'n': 'r-index',
  'u': 'r-index', 'j': 'r-index', 'm': 'r-index',
  'i': 'r-middle', 'k': 'r-middle', ',': 'r-middle',
  'o': 'r-ring', 'l': 'r-ring', '.': 'r-ring',
  'p': 'r-pinky', ';': 'r-pinky', '/': 'r-pinky',
  ' ': 'thumb',
};

const FINGER_COLORS = {
  'l-pinky': '#ec4899',   // pink
  'l-ring': '#a78bfa',    // purple
  'l-middle': '#3b82f6',  // blue
  'l-index': '#00d4ff',   // cyan
  'r-index': '#10b981',   // green
  'r-middle': '#f59e0b',  // amber
  'r-ring': '#f97316',    // orange
  'r-pinky': '#ef4444',   // red
  'thumb': '#6b7280',     // gray
};

const FINGER_NAMES = {
  'l-pinky': 'left pinky',
  'l-ring': 'left ring finger',
  'l-middle': 'left middle finger',
  'l-index': 'left index finger',
  'r-index': 'right index finger',
  'r-middle': 'right middle finger',
  'r-ring': 'right ring finger',
  'r-pinky': 'right pinky',
  'thumb': 'thumb',
};

// ---- Keyboard Layout ----
const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const HOME_ROW_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

// ---- Module Definitions ----
const MODULES = [
  {
    id: 1,
    name: 'Home Row Left',
    description: 'Learn the left home row keys',
    keys: ['a', 's', 'd', 'f'],
    newKeys: ['a', 's', 'd', 'f'],
    icon: '🏠',
    words: [
      'add', 'sad', 'fad', 'dad', 'ads', 'as', 'aaa', 'sss', 'ddd', 'fff',
      'asdf', 'fdsa', 'fads', 'dads', 'adds', 'sass', 'fads', 'asdf', 'das',
      'asd', 'dsa', 'fas', 'saf', 'daf', 'fad', 'sad', 'add', 'dad',
    ],
    drillSequences: [
      'fff jjj fff jjj', 'aaa ;;; aaa ;;;',
      'asdf fdsa asdf', 'dad sad fad add',
      'fads adds sass dads', 'as dad adds fads',
    ],
  },
  {
    id: 2,
    name: 'Home Row Right',
    description: 'Learn the right home row keys',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
    newKeys: ['j', 'k', 'l'],
    icon: '🏠',
    words: [
      'all', 'fall', 'ask', 'flask', 'lad', 'lass', 'lass', 'jab',
      'salad', 'laksa', 'laff', 'flask', 'skull', 'fall', 'alk', 'jak',
      'lads', 'falls', 'dull', 'skull', 'jall', 'kaf', 'lak', 'salk',
    ],
    drillSequences: [
      'jjj kkk lll jkl', 'fjf dkd sls jkl',
      'fall lads ask all', 'flask salad lad lass',
      'asdf jkl asdf jkl', 'all fall flask lads',
    ],
  },
  {
    id: 3,
    name: 'Full Home Row',
    description: 'Bridge the home row with G and H',
    keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    newKeys: ['g', 'h'],
    icon: '🌉',
    words: [
      'gal', 'glad', 'hall', 'half', 'had', 'has', 'gash', 'lash',
      'hash', 'dash', 'flash', 'shall', 'shag', 'flag', 'slag', 'hag',
      'gag', 'jag', 'lag', 'sag', 'glass', 'gall', 'ghaf', 'shah',
    ],
    drillSequences: [
      'ggg hhh ggg hhh', 'fgf jhj fgf jhj',
      'glad hall half gash', 'flash shall flag dash',
      'had has hall glass', 'gash hash lash flash',
    ],
  },
  {
    id: 4,
    name: 'Reach Up: E R U I',
    description: 'Extend to top row index & middle fingers',
    keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'e', 'r', 'u', 'i'],
    newKeys: ['e', 'r', 'u', 'i'],
    icon: '☝️',
    words: [
      'fire', 'ride', 'like', 'girl', 'sure', 'hide', 'rule', 'guide',
      'figure', 'desire', 'rise', 'side', 'higher', 'large', 'share',
      'idea', 'use', 'real', 'regard', 'release', 'read', 'fair', 'hear',
      'air', 'require', 'held', 'field', 'lead', 'fear', 'raise', 'regular',
    ],
    drillSequences: [
      'eee rrr uuu iii', 'ded frf juj kik',
      'fire ride like girl', 'sure hide rule guide',
      'figure desire rise side', 'read fair hear real',
    ],
  },
  {
    id: 5,
    name: 'Reach Further: T Y W O',
    description: 'More top row keys for common words',
    keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'e', 'r', 'u', 'i', 't', 'y', 'w', 'o'],
    newKeys: ['t', 'y', 'w', 'o'],
    icon: '🔝',
    words: [
      'work', 'your', 'today', 'story', 'write', 'tower', 'would', 'style',
      'world', 'other', 'water', 'still', 'thought', 'youth', 'worth',
      'growth', 'thirty', 'worthy', 'total', 'history', 'struggle', 'worry',
      'throw', 'widow', 'toward', 'follow', 'fellow', 'yellow', 'hollow',
    ],
    drillSequences: [
      'ttt yyy www ooo', 'ftf jyj sws lol',
      'work your today story', 'write tower would style',
      'world other water still', 'worthy total history',
    ],
  },
  {
    id: 6,
    name: 'Top Row Complete: Q P',
    description: 'Complete the top row',
    keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'e', 'r', 'u', 'i', 't', 'y', 'w', 'o', 'q', 'p'],
    newKeys: ['q', 'p'],
    icon: '🔤',
    words: [
      'quick', 'equal', 'quite', 'reply', 'power', 'party', 'quote', 'quest',
      'proper', 'popular', 'perhaps', 'quarter', 'quality', 'require',
      'purple', 'prototype', 'question', 'pleasure', 'help', 'put', 'push',
      'people', 'popular', 'sport', 'spirit', 'equipment', 'purpose',
    ],
    drillSequences: [
      'qqq ppp qqq ppp', 'aqp ;pq aqp ;pq',
      'quick equal quite reply', 'power party quote quest',
      'proper popular perhaps', 'quality question purpose',
    ],
  },
  {
    id: 7,
    name: 'Bottom Row',
    description: 'Learn Z, X, C, V, B, N, M',
    keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'e', 'r', 'u', 'i', 't', 'y', 'w', 'o', 'q', 'p', 'z', 'x', 'c', 'v', 'b', 'n', 'm'],
    newKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    icon: '⬇️',
    words: [
      'exam', 'much', 'name', 'come', 'next', 'move', 'back', 'black',
      'become', 'combine', 'number', 'problem', 'broken', 'complex',
      'novel', 'mix', 'zinc', 'cabin', 'climb', 'zone', 'maximum',
      'bench', 'blank', 'concern', 'between', 'common', 'victim',
    ],
    drillSequences: [
      'zzz xxx ccc vvv bbb nnn mmm',
      'aza sxs dcd fvf gbg hnj mj',
      'exam much name come next', 'move back black become',
      'combine number problem', 'complex novel cabin climb',
    ],
  },
  {
    id: 8,
    name: 'Full Alphabet Review',
    description: 'Put it all together!',
    keys: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    newKeys: [],
    icon: '🏆',
    words: [
      'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
      'keyboard', 'practice', 'amazing', 'journey', 'excellent',
      'wonderful', 'knowledge', 'champion', 'adventure', 'beautiful',
      'fantastic', 'brilliant', 'education', 'important', 'question',
      'frequency', 'magazine', 'recognize', 'objective', 'executive',
    ],
    drillSequences: [
      'the quick brown fox jumps over the lazy dog',
      'pack my box with five dozen liquor jugs',
      'how vexingly quick daft zebras jump',
      'keyboard practice makes you a champion',
    ],
  },
];

const STORAGE_KEY_LEARN = 'manifesto_learn_progress';

// ---- Word Generator (adaptive) ----
function generateWordsFromKeys(keys, count = 30) {
  const keySet = new Set(keys);
  const allModuleWords = [];

  // Collect all words from modules whose keys are subsets
  MODULES.forEach((mod) => {
    if (mod.keys.every((k) => keySet.has(k))) {
      allModuleWords.push(...mod.words);
    }
  });

  // Also generate random combinations
  const generated = [];
  for (let i = 0; i < 20; i++) {
    const len = 2 + Math.floor(Math.random() * 5);
    let word = '';
    const arr = keys.filter((k) => k !== ';');
    for (let j = 0; j < len; j++) {
      word += arr[Math.floor(Math.random() * arr.length)];
    }
    generated.push(word);
  }

  const pool = [...new Set([...allModuleWords, ...generated])];
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return result;
}

// ---- Progress Management ----
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LEARN) || '{}');
  } catch { return {}; }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY_LEARN, JSON.stringify(progress));
}

function getCompletedModules(progress) {
  return Object.keys(progress)
    .filter((k) => progress[k]?.completed)
    .map(Number);
}

function getLearnedKeys(progress) {
  const completed = getCompletedModules(progress);
  const keys = new Set();
  completed.forEach((id) => {
    const mod = MODULES.find((m) => m.id === id);
    if (mod) mod.keys.forEach((k) => keys.add(k));
  });
  // Always include space for practice
  return [...keys];
}

function isModuleUnlocked(moduleId, progress) {
  if (moduleId === 1) return true;
  const prev = progress[moduleId - 1] || progress[String(moduleId - 1)];
  return !!prev?.completed;
}

// ================================================================
// LearnTyping Class
// ================================================================
export class LearnTyping {
  constructor(container) {
    this.container = container;
    this.progress = loadProgress();
    this.currentView = 'modules'; // modules | lesson | drill | test | practice
    this.currentModule = null;
    this.onExit = null;

    // Lesson state
    this.lessonKeys = [];
    this.lessonIndex = 0;
    this.lessonCorrect = 0;
    this.lessonTotal = 0;

    // Drill / Test state
    this.drillWords = [];
    this.drillWordIndex = 0;
    this.drillCharIndex = 0;
    this.drillTyped = [];
    this.drillStartTime = null;
    this.drillIsRunning = false;
    this.drillCorrectChars = 0;
    this.drillTotalChars = 0;
    this.drillTimer = null;
    this.drillTimeLimit = 60;
    this.drillTimeLeft = 60;

    // Practice state
    this.practiceWords = [];

    this._keyHandler = null;
    this._globalKeyHandler = null;
  }

  render() {
    switch (this.currentView) {
      case 'modules':
        this.renderModuleList();
        break;
      case 'lesson':
        this.renderLesson();
        break;
      case 'drill':
        this.renderDrill();
        break;
      case 'test':
        this.renderTest();
        break;
      case 'practice':
        this.renderPractice();
        break;
    }
  }

  // ---- Module List View ----
  renderModuleList() {
    const completedCount = getCompletedModules(this.progress).length;

    const moduleCards = MODULES.map((mod) => {
      const isCompleted = !!this.progress[mod.id]?.completed;
      const isUnlocked = isModuleUnlocked(mod.id, this.progress);
      const isCurrent = isUnlocked && !isCompleted;

      let statusClass = 'locked';
      let statusIcon = '🔒';
      if (isCompleted) { statusClass = 'completed'; statusIcon = '✅'; }
      else if (isCurrent) { statusClass = 'current'; statusIcon = '🔓'; }

      return `
        <div class="lt-module-card ${statusClass}" data-module-id="${mod.id}" id="lt-module-${mod.id}">
          <div class="lt-module-icon">${mod.icon}</div>
          <div class="lt-module-info">
            <div class="lt-module-name">Module ${mod.id}: ${mod.name}</div>
            <div class="lt-module-desc">${mod.description}</div>
            <div class="lt-module-keys">
              ${mod.newKeys.length > 0
                ? mod.newKeys.map((k) => `<kbd class="lt-key-badge" style="border-color:${FINGER_COLORS[FINGER_MAP[k]] || '#666'}">${k.toUpperCase()}</kbd>`).join('')
                : '<span class="lt-module-review">Full Review</span>'}
            </div>
          </div>
          ${isCompleted ? `<button class="lt-module-reset" data-reset-id="${mod.id}" title="Reset Module">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset
          </button>` : ''}
          <div class="lt-module-status">${statusIcon}</div>
        </div>
      `;
    }).join('');

    // Check if practice mode is available
    const hasPractice = completedCount >= 1;

    this.container.innerHTML = `
      <div class="lt-view" id="lt-view">
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="lt-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Back</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">🎓</span>
            <span class="tt-brand-text">Learn Touch Typing</span>
          </div>
          <div class="tt-spacer"></div>
          ${hasPractice ? `
          <button class="btn btn-primary" id="lt-practice-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            <span>Practice</span>
          </button>` : ''}
        </div>

        <div class="lt-progress-bar">
          <div class="lt-progress-fill" style="width: ${(completedCount / MODULES.length) * 100}%"></div>
        </div>
        <div class="lt-progress-text">${completedCount} / ${MODULES.length} modules completed</div>

        <div class="lt-modules-grid">
          ${moduleCards}
        </div>
      </div>
    `;

    this.attachModuleListEvents();
  }

  attachModuleListEvents() {
    document.getElementById('lt-back-btn')?.addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    document.getElementById('lt-practice-btn')?.addEventListener('click', () => {
      this.currentView = 'practice';
      this.render();
    });

    this.container.querySelectorAll('.lt-module-card.current, .lt-module-card.completed').forEach((card) => {
      card.addEventListener('click', () => {
        const moduleId = parseInt(card.dataset.moduleId, 10);
        this.currentModule = MODULES.find((m) => m.id === moduleId);
        if (this.currentModule) {
          this.currentView = 'lesson';
          this.initLesson();
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.lt-module-reset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const moduleId = parseInt(btn.dataset.resetId, 10);
        if (this.progress[moduleId]) {
          this.progress[moduleId].completed = false;
          saveProgress(this.progress);
          this.render();
        }
      });
    });
  }

  // ---- Lesson View (Key-by-key guided) ----
  initLesson() {
    const mod = this.currentModule;
    // Build a sequence of keys to practice
    // Start with new keys individually, then mix
    const keys = [];
    // Each new key 3 times
    mod.newKeys.forEach((k) => {
      for (let i = 0; i < 4; i++) keys.push(k);
    });
    // Mixed sequences
    for (let i = 0; i < 12; i++) {
      const pool = mod.newKeys.length > 0 ? mod.newKeys : mod.keys;
      keys.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Some from all module keys
    for (let i = 0; i < 8; i++) {
      keys.push(mod.keys[Math.floor(Math.random() * mod.keys.length)]);
    }

    this.lessonKeys = keys;
    this.lessonIndex = 0;
    this.lessonCorrect = 0;
    this.lessonTotal = 0;
  }

  renderLesson() {
    const mod = this.currentModule;
    const currentKey = this.lessonKeys[this.lessonIndex];
    const finger = FINGER_MAP[currentKey] || 'l-index';
    const fingerName = FINGER_NAMES[finger] || 'index finger';
    const fingerColor = FINGER_COLORS[finger] || '#00d4ff';
    const progress = ((this.lessonIndex / this.lessonKeys.length) * 100).toFixed(0);
    const isDone = this.lessonIndex >= this.lessonKeys.length;

    if (isDone) {
      // Mark module as completed & save progress automatically
      this.progress[mod.id] = {
        completed: true,
        completedAt: new Date().toISOString(),
      };
      saveProgress(this.progress);
    }

    this.container.innerHTML = `
      <div class="lt-view" id="lt-view">
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="lt-lesson-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Modules</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">${mod.icon}</span>
            <span class="tt-brand-text">Module ${mod.id}: ${mod.name} — Lesson</span>
          </div>
          <div class="tt-spacer"></div>
        </div>

        <div class="lt-progress-bar">
          <div class="lt-progress-fill" style="width: ${progress}%"></div>
        </div>

        ${isDone ? this.renderLessonComplete() : `
        <!-- AI Guide -->
        <div class="lt-ai-guide" id="lt-ai-guide">
          <div class="lt-ai-avatar">🤖</div>
          <div class="lt-ai-bubble">
            Press the <strong style="color:${fingerColor}">'${currentKey.toUpperCase()}'</strong> key with your <strong style="color:${fingerColor}">${fingerName}</strong>
          </div>
        </div>

        <!-- Big key display -->
        <div class="lt-big-key" id="lt-big-key" style="border-color:${fingerColor}; color:${fingerColor}">
          ${currentKey.toUpperCase()}
        </div>

        <!-- Keyboard -->
        ${this.renderKeyboard(currentKey, mod.keys)}

        <!-- Hand Guide -->
        ${this.renderHandGuide(finger)}

        <div class="lt-lesson-progress">
          <span>${this.lessonIndex} / ${this.lessonKeys.length}</span>
        </div>
        `}
      </div>
    `;

    if (!isDone) {
      this.attachLessonEvents();
    } else {
      this.attachLessonCompleteEvents();
    }
  }

  renderLessonComplete() {
    const accuracy = this.lessonTotal > 0 ? Math.round((this.lessonCorrect / this.lessonTotal) * 100) : 100;
    const hasNext = MODULES.some((m) => m.id === this.currentModule.id + 1);

    return `
      <div class="lt-complete">
        <div class="lt-complete-icon">🎉</div>
        <div class="lt-complete-title">Module ${this.currentModule.id} Lesson Complete!</div>
        <div class="lt-complete-stat">Accuracy: <strong>${accuracy}%</strong> — Next Module Unlocked! 🔓</div>
        <div class="lt-complete-actions">
          ${hasNext ? `<button class="btn btn-primary" id="lt-go-next-module">Next Module (${this.currentModule.id + 1}) →</button>` : ''}
          <button class="btn btn-secondary" id="lt-go-drill">Practice Drill →</button>
          <button class="btn btn-secondary" id="lt-lesson-to-modules">Modules List</button>
        </div>
      </div>
    `;
  }

  attachLessonEvents() {
    document.getElementById('lt-lesson-back')?.addEventListener('click', () => {
      this.cleanupKeyHandlers();
      this.currentView = 'modules';
      this.render();
    });

    this.cleanupKeyHandlers();
    this._keyHandler = (e) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();

      const expected = this.lessonKeys[this.lessonIndex];
      const typed = e.key.toLowerCase();
      this.lessonTotal++;

      if (typed === expected) {
        this.lessonCorrect++;
        soundEngine.playKeySound(false, false);
        addXP(2);
        this.flashKey(expected, 'correct');
        this.lessonIndex++;
        this.render();
      } else {
        soundEngine.playKeySound(false, true);
        this.flashKey(expected, 'incorrect');
        this.shakeGuide();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  attachLessonCompleteEvents() {
    document.getElementById('lt-lesson-back')?.addEventListener('click', () => {
      this.cleanupKeyHandlers();
      this.currentView = 'modules';
      this.render();
    });

    document.getElementById('lt-lesson-to-modules')?.addEventListener('click', () => {
      this.cleanupKeyHandlers();
      this.currentView = 'modules';
      this.render();
    });

    document.getElementById('lt-go-next-module')?.addEventListener('click', () => {
      this.cleanupKeyHandlers();
      const nextId = this.currentModule.id + 1;
      const nextMod = MODULES.find((m) => m.id === nextId);
      if (nextMod) {
        this.currentModule = nextMod;
        this.currentView = 'lesson';
        this.initLesson();
        this.render();
      } else {
        this.currentView = 'modules';
        this.render();
      }
    });

    document.getElementById('lt-go-drill')?.addEventListener('click', () => {
      this.currentView = 'drill';
      this.initDrill();
      this.render();
    });

    document.getElementById('lt-redo-lesson')?.addEventListener('click', () => {
      this.initLesson();
      this.render();
    });
  }

  flashKey(key, type) {
    const keyEl = document.querySelector(`[data-kb-key="${key}"]`);
    if (keyEl) {
      keyEl.classList.add(`flash-${type}`);
      setTimeout(() => keyEl.classList.remove(`flash-${type}`), 300);
    }
  }

  shakeGuide() {
    const guide = document.getElementById('lt-ai-guide');
    if (guide) {
      guide.classList.add('shake');
      setTimeout(() => guide.classList.remove('shake'), 400);
    }
    const bigKey = document.getElementById('lt-big-key');
    if (bigKey) {
      bigKey.classList.add('shake');
      setTimeout(() => bigKey.classList.remove('shake'), 400);
    }
  }

  // ---- Drill View (Word practice) ----
  initDrill() {
    const mod = this.currentModule;
    this.drillWords = generateWordsFromKeys(mod.keys, 40);
    this.drillWordIndex = 0;
    this.drillCharIndex = 0;
    this.drillTyped = new Array(this.drillWords.length).fill('');
    this.drillStartTime = null;
    this.drillIsRunning = false;
    this.drillCorrectChars = 0;
    this.drillTotalChars = 0;
    this.drillTimeLimit = 60;
    this.drillTimeLeft = 60;
    if (this.drillTimer) clearInterval(this.drillTimer);
    this.drillTimer = null;
  }

  renderDrill() {
    this.renderTypingView('Drill', false);
  }

  // ---- Test View ----
  renderTest() {
    this.renderTypingView('Test', true);
  }

  renderTypingView(mode, isTest) {
    const mod = this.currentModule;
    const isDone = this.drillWordIndex >= this.drillWords.length || (this.drillIsRunning && this.drillTimeLeft <= 0);

    this.container.innerHTML = `
      <div class="lt-view" id="lt-view">
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="lt-drill-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Modules</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">${mod.icon}</span>
            <span class="tt-brand-text">Module ${mod.id}: ${mod.name} — ${mode}</span>
          </div>
          <div class="tt-spacer"></div>
        </div>

        ${isDone ? this.renderDrillComplete(isTest) : `
        ${isTest ? `
        <div class="tt-timer-row">
          <div class="tt-timer ${this.drillTimeLeft <= 5 && this.drillIsRunning ? 'warning' : ''}" id="lt-drill-timer">${this.drillTimeLeft}</div>
        </div>` : ''}

        <!-- Words display -->
        <div class="tt-words-wrapper" id="lt-words-wrapper">
          <div class="tt-words" id="lt-words">${this.renderDrillWords()}</div>
        </div>

        <!-- Keyboard -->
        ${this.renderKeyboard(this.getNextExpectedKey(), mod.keys)}

        <!-- Hand Guide -->
        ${this.renderHandGuide(FINGER_MAP[this.getNextExpectedKey()] || 'l-index')}

        <!-- Live stats -->
        <div class="tt-live-stats" id="lt-live-stats">
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="lt-live-wpm">0</span>
            <span class="tt-live-stat-label">wpm</span>
          </div>
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="lt-live-acc">100</span>
            <span class="tt-live-stat-label">accuracy</span>
          </div>
        </div>

        <input type="text" class="tt-hidden-input" id="lt-hidden-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
        `}
      </div>
    `;

    if (!isDone) {
      this.attachDrillEvents(isTest);
      document.getElementById('lt-hidden-input')?.focus();
    } else {
      this.attachDrillCompleteEvents(isTest);
    }
  }

  getNextExpectedKey() {
    const word = this.drillWords[this.drillWordIndex];
    if (!word) return 'a';
    const typed = this.drillTyped[this.drillWordIndex] || '';
    return word[typed.length] || ' ';
  }

  renderDrillWords() {
    let html = '';
    this.drillWords.forEach((word, wi) => {
      const isCurrent = wi === this.drillWordIndex;
      const typedWord = this.drillTyped[wi] || '';
      const isPast = wi < this.drillWordIndex;

      let wordClass = 'tt-word';
      if (isCurrent) wordClass += ' current';
      if (isPast) {
        wordClass += typedWord === word ? ' correct' : ' incorrect';
      }

      let chars = '';
      for (let ci = 0; ci < word.length; ci++) {
        let charClass = 'tt-char';
        if (isCurrent || isPast) {
          if (ci < typedWord.length) {
            charClass += typedWord[ci] === word[ci] ? ' correct' : ' incorrect';
          } else if (isCurrent && ci === typedWord.length) {
            charClass += ' cursor';
          }
        }
        chars += `<span class="${charClass}">${word[ci]}</span>`;
      }

      if (typedWord.length > word.length) {
        for (let ci = word.length; ci < typedWord.length; ci++) {
          chars += `<span class="tt-char extra">${typedWord[ci]}</span>`;
        }
      }

      html += `<span class="${wordClass}">${chars}</span>`;
    });
    return html;
  }

  attachDrillEvents(isTest) {
    document.getElementById('lt-drill-back')?.addEventListener('click', () => {
      this.cleanupKeyHandlers();
      if (this.drillTimer) clearInterval(this.drillTimer);
      this.currentView = 'modules';
      this.render();
    });

    this.cleanupKeyHandlers();
    this._keyHandler = (e) => {
      if (e.key === 'Tab' || e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      if (e.key === 'Backspace') {
        this.handleDrillBackspace(e.ctrlKey);
        return;
      }
      if (e.key === ' ') {
        this.handleDrillSpace(isTest);
        return;
      }
      if (e.key.length === 1 && !e.altKey) {
        this.handleDrillChar(e.key, isTest);
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  handleDrillChar(char, isTest) {
    if (!this.drillIsRunning) {
      this.drillIsRunning = true;
      this.drillStartTime = Date.now();
      if (isTest) this.startDrillTimer();
    }

    const wi = this.drillWordIndex;
    if (wi >= this.drillWords.length) return;
    if (!this.drillTyped[wi]) this.drillTyped[wi] = '';
    this.drillTyped[wi] += char;
    this.drillTotalChars++;

    const expected = this.drillWords[wi][this.drillTyped[wi].length - 1];
    if (char === expected) {
      this.drillCorrectChars++;
    }

    this.updateDrillDisplay();
  }

  handleDrillSpace(isTest) {
    if (!this.drillIsRunning) return;
    const wi = this.drillWordIndex;
    if (!this.drillTyped[wi] || this.drillTyped[wi].length === 0) return;

    this.drillWordIndex++;
    this.drillCharIndex = 0;

    if (this.drillWordIndex >= this.drillWords.length) {
      this.finishDrill(isTest);
      return;
    }

    this.updateDrillDisplay();
    this.scrollDrillWords();
  }

  handleDrillBackspace() {
    const wi = this.drillWordIndex;
    if (!this.drillTyped[wi] || this.drillTyped[wi].length === 0) return;
    this.drillTyped[wi] = this.drillTyped[wi].slice(0, -1);
    this.updateDrillDisplay();
  }

  updateDrillDisplay() {
    const wordsEl = document.getElementById('lt-words');
    if (wordsEl) wordsEl.innerHTML = this.renderDrillWords();

    // Update keyboard highlight
    const nextKey = this.getNextExpectedKey();
    this.updateKeyboardHighlight(nextKey);

    // Update hand guide
    this.updateHandHighlight(FINGER_MAP[nextKey] || 'l-index');

    // Live stats
    if (this.drillStartTime) {
      const elapsed = (Date.now() - this.drillStartTime) / 1000 / 60;
      const wpm = elapsed > 0 ? Math.round((this.drillCorrectChars / 5) / elapsed) : 0;
      const acc = this.drillTotalChars > 0 ? Math.round((this.drillCorrectChars / this.drillTotalChars) * 100) : 100;
      const wpmEl = document.getElementById('lt-live-wpm');
      const accEl = document.getElementById('lt-live-acc');
      if (wpmEl) wpmEl.textContent = wpm;
      if (accEl) accEl.textContent = acc;
    }
  }

  scrollDrillWords() {
    const wrapper = document.getElementById('lt-words-wrapper');
    const wordsEl = document.getElementById('lt-words');
    const current = wordsEl?.querySelector('.tt-word.current');
    if (!wrapper || !current || !wordsEl) return;

    const wRect = wrapper.getBoundingClientRect();
    const cRect = current.getBoundingClientRect();
    if (cRect.top > wRect.top + wRect.height * 0.5) {
      const offset = cRect.top - wRect.top - 40;
      wordsEl.style.transform = `translateY(-${Math.max(0, offset)}px)`;
    }
  }

  startDrillTimer() {
    this.drillTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.drillStartTime) / 1000);
      this.drillTimeLeft = Math.max(0, this.drillTimeLimit - elapsed);

      const timerEl = document.getElementById('lt-drill-timer');
      if (timerEl) {
        timerEl.textContent = this.drillTimeLeft;
        if (this.drillTimeLeft <= 5) timerEl.classList.add('warning');
      }

      if (this.drillTimeLeft <= 0) {
        this.finishDrill(true);
      }
    }, 100);
  }

  finishDrill(isTest) {
    this.drillIsRunning = false;
    if (this.drillTimer) clearInterval(this.drillTimer);
    this.cleanupKeyHandlers();

    // Mark module as completed on drill or test completion!
    this.progress[this.currentModule.id] = {
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveProgress(this.progress);

    this.render();
  }

  renderDrillComplete(isTest) {
    const elapsed = this.drillStartTime ? (Date.now() - this.drillStartTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((this.drillCorrectChars / 5) / minutes) : 0;
    const acc = this.drillTotalChars > 0 ? Math.round((this.drillCorrectChars / this.drillTotalChars) * 100) : 100;
    const hasNext = MODULES.some((m) => m.id === this.currentModule.id + 1);

    return `
      <div class="lt-complete">
        <div class="lt-complete-icon">🏆</div>
        <div class="lt-complete-title">Module ${this.currentModule.id}: ${this.currentModule.name} Completed!</div>
        <div class="lt-complete-stats">
          <div class="lt-cstat"><span class="lt-cstat-val">${wpm}</span><span class="lt-cstat-lbl">WPM</span></div>
          <div class="lt-cstat"><span class="lt-cstat-val">${acc}%</span><span class="lt-cstat-lbl">Accuracy</span></div>
          <div class="lt-cstat"><span class="lt-cstat-val">${Math.round(elapsed)}s</span><span class="lt-cstat-lbl">Time</span></div>
        </div>
        <div class="lt-complete-actions">
          ${hasNext ? `<button class="btn btn-primary" id="lt-go-next-module">Next Module (${this.currentModule.id + 1}) →</button>` : ''}
          <button class="btn btn-secondary" id="lt-to-modules">Modules List</button>
          <button class="btn btn-secondary" id="lt-redo-drill">Try Again</button>
        </div>
      </div>
    `;
  }

  attachDrillCompleteEvents(isTest) {
    document.getElementById('lt-drill-back')?.addEventListener('click', () => {
      this.currentView = 'modules';
      this.render();
    });

    document.getElementById('lt-to-modules')?.addEventListener('click', () => {
      this.currentView = 'modules';
      this.render();
    });

    document.getElementById('lt-go-next-module')?.addEventListener('click', () => {
      const nextId = this.currentModule.id + 1;
      const nextMod = MODULES.find((m) => m.id === nextId);
      if (nextMod) {
        this.currentModule = nextMod;
        this.currentView = 'lesson';
        this.initLesson();
        this.render();
      } else {
        this.currentView = 'modules';
        this.render();
      }
    });

    document.getElementById('lt-redo-drill')?.addEventListener('click', () => {
      this.initDrill();
      this.render();
    });
  }

  // ---- Practice View (Infinite adaptive) ----
  renderPractice() {
    const learnedKeys = getLearnedKeys(this.progress);
    if (learnedKeys.length === 0) {
      this.currentView = 'modules';
      this.render();
      return;
    }

    this.drillWords = generateWordsFromKeys(learnedKeys, 60);
    this.drillWordIndex = 0;
    this.drillTyped = new Array(this.drillWords.length).fill('');
    this.drillStartTime = null;
    this.drillIsRunning = false;
    this.drillCorrectChars = 0;
    this.drillTotalChars = 0;

    this.container.innerHTML = `
      <div class="lt-view" id="lt-view">
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="lt-practice-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Modules</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">♾️</span>
            <span class="tt-brand-text">Adaptive Practice — ${learnedKeys.filter(k => k !== ' ').length} keys learned</span>
          </div>
          <div class="tt-spacer"></div>
        </div>

        <div class="tt-words-wrapper" id="lt-words-wrapper" style="height: 180px;">
          <div class="tt-words" id="lt-words">${this.renderDrillWords()}</div>
        </div>

        ${this.renderKeyboard(this.getNextExpectedKey(), learnedKeys)}
        ${this.renderHandGuide(FINGER_MAP[this.getNextExpectedKey()] || 'l-index')}

        <div class="tt-live-stats" id="lt-live-stats">
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="lt-live-wpm">0</span>
            <span class="tt-live-stat-label">wpm</span>
          </div>
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="lt-live-acc">100</span>
            <span class="tt-live-stat-label">accuracy</span>
          </div>
        </div>

        <div class="tt-hint"><span>Type forever · Words adapt to your learned keys</span></div>

        <input type="text" class="tt-hidden-input" id="lt-hidden-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
    `;

    this.attachPracticeEvents(learnedKeys);
    document.getElementById('lt-hidden-input')?.focus();
  }

  attachPracticeEvents(learnedKeys) {
    document.getElementById('lt-practice-back')?.addEventListener('click', () => {
      this.cleanupKeyHandlers();
      this.currentView = 'modules';
      this.render();
    });

    // Click on words to focus
    document.getElementById('lt-words-wrapper')?.addEventListener('click', () => {
      document.getElementById('lt-hidden-input')?.focus();
    });

    this.cleanupKeyHandlers();
    this._keyHandler = (e) => {
      if (e.key === 'Tab' || e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      if (e.key === 'Backspace') {
        this.handleDrillBackspace();
        return;
      }
      if (e.key === ' ') {
        // For practice — infinite: when near end, add more words
        if (!this.drillIsRunning) return;
        const wi = this.drillWordIndex;
        if (!this.drillTyped[wi] || this.drillTyped[wi].length === 0) return;

        this.drillWordIndex++;

        // Generate more words when running low
        if (this.drillWordIndex >= this.drillWords.length - 5) {
          const more = generateWordsFromKeys(learnedKeys, 20);
          this.drillWords.push(...more);
          this.drillTyped.push(...new Array(more.length).fill(''));
        }

        this.updateDrillDisplay();
        this.scrollDrillWords();
        return;
      }
      if (e.key.length === 1 && !e.altKey) {
        this.handleDrillChar(e.key, false);
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  // ---- Keyboard Renderer ----
  renderKeyboard(activeKey, moduleKeys) {
    const moduleKeySet = new Set(moduleKeys);
    let html = '<div class="lt-keyboard" id="lt-keyboard">';

    KEYBOARD_ROWS.forEach((row, ri) => {
      html += `<div class="lt-kb-row ${ri === 0 ? 'lt-kb-top' : ri === 1 ? 'lt-kb-home' : 'lt-kb-bottom'}">`;

      // Home row offset
      if (ri === 1) html += '<div class="lt-kb-offset-home"></div>';
      if (ri === 2) html += '<div class="lt-kb-offset-bottom"></div>';

      row.forEach((key) => {
        const finger = FINGER_MAP[key] || 'l-index';
        const color = FINGER_COLORS[finger];
        const isActive = key === activeKey;
        const isInModule = moduleKeySet.has(key);
        const isHome = HOME_ROW_KEYS.includes(key);

        let classes = 'lt-kb-key';
        if (isActive) classes += ' active';
        if (isInModule) classes += ' in-module';
        if (isHome) classes += ' home-key';

        html += `<div class="${classes}" data-kb-key="${key}" style="--finger-color: ${color}">
          <span>${key === ';' ? ';' : key.toUpperCase()}</span>
          ${isHome ? '<div class="lt-kb-bump"></div>' : ''}
        </div>`;
      });

      html += '</div>';
    });

    // Spacebar
    html += `<div class="lt-kb-row lt-kb-space-row">
      <div class="lt-kb-key lt-kb-space ${activeKey === ' ' ? 'active' : ''}" data-kb-key=" " style="--finger-color: ${FINGER_COLORS.thumb}">
        <span>Space</span>
      </div>
    </div>`;

    html += '</div>';
    return html;
  }

  updateKeyboardHighlight(activeKey) {
    const kb = document.getElementById('lt-keyboard');
    if (!kb) return;
    kb.querySelectorAll('.lt-kb-key').forEach((el) => {
      el.classList.toggle('active', el.dataset.kbKey === activeKey);
    });
  }

  // ---- Hand Guide ----
  renderHandGuide(activeFinger) {
    const fingers = [
      { id: 'l-pinky', label: 'P', x: 8 },
      { id: 'l-ring', label: 'R', x: 22 },
      { id: 'l-middle', label: 'M', x: 32 },
      { id: 'l-index', label: 'I', x: 42 },
      { id: 'r-index', label: 'I', x: 58 },
      { id: 'r-middle', label: 'M', x: 68 },
      { id: 'r-ring', label: 'R', x: 78 },
      { id: 'r-pinky', label: 'P', x: 92 },
    ];

    const dots = fingers.map((f) => {
      const isActive = f.id === activeFinger;
      const color = FINGER_COLORS[f.id];
      return `<div class="lt-hand-dot ${isActive ? 'active' : ''}" id="lt-hand-${f.id}"
                   style="left:${f.x}%; --dot-color:${color}" title="${FINGER_NAMES[f.id]}">
        <span>${f.label}</span>
      </div>`;
    }).join('');

    return `
      <div class="lt-hand-guide" id="lt-hand-guide">
        <div class="lt-hand-label">Left Hand</div>
        <div class="lt-hand-dots">
          ${dots}
        </div>
        <div class="lt-hand-label lt-hand-label-right">Right Hand</div>
        <div class="lt-hand-divider"></div>
      </div>
    `;
  }

  updateHandHighlight(activeFinger) {
    const guide = document.getElementById('lt-hand-guide');
    if (!guide) return;
    guide.querySelectorAll('.lt-hand-dot').forEach((dot) => {
      dot.classList.toggle('active', dot.id === `lt-hand-${activeFinger}`);
    });
  }

  // ---- Cleanup ----
  cleanupKeyHandlers() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  destroy() {
    this.cleanupKeyHandlers();
    if (this.drillTimer) clearInterval(this.drillTimer);
    this.container.innerHTML = '';
  }
}
