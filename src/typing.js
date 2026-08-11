// ============================================
// MANIFESTO — Typing Test (MonkeyType-style)
// Smooth, fluent typing practice module
// ============================================

import { soundEngine } from './audio.js';
import { addXP, getXP, getRankForXP } from './gamify.js';
import { saveTypingStats } from './store.js';

// Word pools by difficulty — common English words
export const WORD_POOLS = {
  easy: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
    'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'come', 'could', 'now', 'look', 'only', 'find', 'long', 'very',
    'day', 'most', 'us', 'was', 'use', 'way', 'may', 'each', 'then', 'how'
  ],
  medium: [
    'about', 'above', 'after', 'again', 'along', 'also', 'always', 'among',
    'answer', 'another', 'around', 'asked', 'away', 'back', 'because',
    'before', 'began', 'begin', 'being', 'below', 'between', 'both',
    'build', 'came', 'carry', 'change', 'children', 'city', 'close',
    'country', 'cross', 'different', 'does', 'done', 'door', 'during',
    'early', 'earth', 'enough', 'even', 'every', 'example', 'family',
    'follow', 'food', 'form', 'found', 'give', 'great', 'group', 'grow',
    'hand', 'hard', 'head', 'help', 'here', 'high', 'home', 'house',
    'idea', 'important', 'interest', 'keep', 'kind', 'large', 'last',
    'later', 'learn', 'leave', 'left', 'life', 'light', 'line', 'list',
    'little', 'live', 'long', 'look', 'made', 'many', 'might', 'mile',
    'mind', 'money', 'more', 'morning', 'move', 'much', 'must', 'name',
    'near', 'need', 'never', 'next', 'night', 'number', 'often', 'once',
    'open', 'order', 'other', 'page', 'paper', 'part', 'people', 'place',
    'plant', 'play', 'point', 'problem', 'program', 'question', 'quite',
    'read', 'real', 'right', 'river', 'room', 'school', 'second', 'seem',
    'sentence', 'show', 'side', 'small', 'something', 'sometimes', 'sound',
    'still', 'story', 'study', 'such', 'sure', 'system', 'tell', 'than',
    'thing', 'think', 'those', 'thought', 'through', 'together', 'took',
    'toward', 'tried', 'turn', 'under', 'until', 'upon', 'want', 'water',
    'while', 'white', 'without', 'word', 'work', 'world', 'write', 'year',
    'young', 'state', 'watch', 'color', 'stand', 'start'
  ],
  hard: [
    'absolute', 'abstract', 'academic', 'accomplish', 'acknowledge',
    'algorithm', 'ambiguous', 'analysis', 'appreciate', 'architecture',
    'arrangement', 'assumption', 'atmosphere', 'beautiful', 'benchmark',
    'boulevard', 'bureaucracy', 'calculate', 'catastrophe', 'celebration',
    'characteristic', 'collaboration', 'comfortable', 'communicate',
    'comprehensive', 'concentrate', 'configuration', 'consequence',
    'considerable', 'constitution', 'contemporary', 'contribution',
    'controversial', 'conversation', 'curriculum', 'demonstrate',
    'description', 'development', 'disappointed', 'distinguish',
    'distribution', 'documentary', 'dramatically', 'effectiveness',
    'electricity', 'elimination', 'embarrassment', 'encyclopedia',
    'engineering', 'environment', 'establishment', 'evaluation',
    'examination', 'extraordinary', 'fascination', 'fundamental',
    'government', 'headquarters', 'hypothetical', 'illustration',
    'imagination', 'implementation', 'independence', 'infrastructure',
    'investigation', 'justification', 'knowledge', 'laboratory',
    'legislation', 'manufacturer', 'mathematics', 'Mediterranean',
    'miscellaneous', 'neighborhood', 'nevertheless', 'observation',
    'opportunity', 'organization', 'participation', 'performance',
    'pharmaceutical', 'photography', 'precipitation', 'presentation',
    'professional', 'psychological', 'questionnaire', 'reconnaissance',
    'recommendation', 'rehabilitation', 'relationship', 'representative',
    'responsibility', 'revolutionary', 'sophisticated', 'specification',
    'straightforward', 'surveillance', 'technological', 'temperature',
    'thunderstorm', 'transportation', 'understanding', 'unfortunately',
    'vulnerability', 'quarterback', 'perpendicular', 'xylophone'
  ],
  code: [
    'function', 'return', 'const', 'let', 'var', 'class', 'import', 'export',
    'default', 'async', 'await', 'promise', 'catch', 'throw', 'new', 'this',
    'super', 'extends', 'static', 'constructor', 'prototype', 'typeof',
    'instanceof', 'undefined', 'null', 'true', 'false', 'console', 'document',
    'window', 'element', 'querySelector', 'addEventListener', 'innerHTML',
    'className', 'style', 'display', 'position', 'margin', 'padding',
    'border', 'background', 'color', 'width', 'height', 'flex', 'grid',
    'template', 'component', 'render', 'state', 'props', 'effect', 'hook',
    'reducer', 'context', 'router', 'middleware', 'controller', 'model',
    'database', 'schema', 'query', 'mutation', 'resolver', 'interface',
    'abstract', 'implements', 'generic', 'typescript', 'javascript', 'react',
    'angular', 'express', 'nodejs', 'webpack', 'babel', 'eslint', 'prettier',
    'package', 'module', 'require', 'config', 'server', 'client', 'fetch',
    'response', 'request', 'header', 'method', 'endpoint', 'payload',
    'callback', 'closure', 'scope', 'hoisting', 'iteration', 'recursion',
    'algorithm', 'structure', 'object', 'array', 'string', 'number',
    'boolean', 'symbol', 'iterator', 'generator', 'decorator', 'parameter',
    'argument', 'variable', 'constant', 'operator', 'expression', 'statement',
    'condition', 'switch', 'while', 'break', 'continue', 'debugger',
    'try', 'finally', 'delete', 'in', 'of', 'for', 'if', 'else'
  ],
};

// Motivational quotes for results
const QUOTES = [
  "Every keystroke counts. Keep going! 🔥",
  "Practice makes permanent. You're doing great! ⚡",
  "Speed is nothing without accuracy. Balance is key! 🎯",
  "The keyboard is your instrument. Master it! 🎹",
  "Fingers on fire! Keep that momentum! 🚀",
  "Slow is smooth, smooth is fast. 💎",
  "Your future self will thank you for practicing today! 🌟",
  "Champions are made in practice, not in games! 🏆",
];

/**
 * TypingTest — self-contained typing test engine
 */
export class TypingTest {
  constructor(container) {
    this.container = container;
    this.words = [];
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.typed = []; // typed[wordIndex] = string of typed chars
    this.wordStatuses = []; // 'correct' | 'incorrect' | 'pending'
    this.isRunning = false;
    this.isFinished = false;
    this.timer = null;
    this.startTime = null;
    this.timeLimit = 30; // default
    this.timeLeft = 30;
    this.difficulty = 'medium';
    this.wordCount = 50;
    this.correctChars = 0;
    this.totalChars = 0;
    this.correctWords = 0;
    this.incorrectWords = 0;
    this.onExit = null; // callback to return to main app
    this.onLearn = null; // callback to switch to learn mode

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleXPGained = this.handleXPGained.bind(this);
  }

  /**
   * Render the full typing test UI
   */
  render() {
    this.container.innerHTML = this.getHTML();
    this.attachEvents();
    this.generateWords();
    this.renderWords();
    this.updateTimerDisplay();
    this.focusInput();
  }

  getHTML() {
    const xp = getXP();
    const rank = getRankForXP(xp);

    return `
      <div class="typing-test" id="typing-test">
        <!-- Top bar -->
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="tt-back-btn" title="Back to goals">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Back</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">⌨️</span>
            <span class="tt-brand-text">Typing Practice</span>
          </div>
          <div class="tt-spacer"></div>
          <div class="tt-xp-badge" id="tt-xp-badge">
            <span class="tt-xp-icon">${rank.icon}</span>
            <span class="tt-xp-value">${xp} XP</span>
          </div>
          <button class="btn btn-secondary" id="tt-leaderboard-btn">
            <span>🏆</span>
            <span>Leaderboard</span>
          </button>
          <button class="btn btn-secondary" id="tt-learn-btn">
            <span>🎓</span>
            <span>Learn Touch Typing</span>
          </button>
        </div>

        <!-- Config bar -->
        <div class="tt-config" id="tt-config">
          <div class="tt-config-group">
            <span class="tt-config-label">time</span>
            <div class="tt-config-pills">
              <button class="tt-pill ${this.timeLimit === 15 ? 'active' : ''}" data-time="15">15</button>
              <button class="tt-pill ${this.timeLimit === 30 ? 'active' : ''}" data-time="30">30</button>
              <button class="tt-pill ${this.timeLimit === 60 ? 'active' : ''}" data-time="60">60</button>
              <button class="tt-pill ${this.timeLimit === 120 ? 'active' : ''}" data-time="120">120</button>
              <button class="tt-pill ${this.timeLimit === Infinity ? 'active' : ''}" data-time="Infinity" title="Free Type (Infinite)">∞</button>
            </div>
          </div>
          <div class="tt-config-divider"></div>
          <div class="tt-config-group">
            <span class="tt-config-label">difficulty</span>
            <div class="tt-config-pills">
              <button class="tt-pill ${this.difficulty === 'easy' ? 'active' : ''}" data-diff="easy">easy</button>
              <button class="tt-pill ${this.difficulty === 'medium' ? 'active' : ''}" data-diff="medium">medium</button>
              <button class="tt-pill ${this.difficulty === 'hard' ? 'active' : ''}" data-diff="hard">hard</button>
              <button class="tt-pill ${this.difficulty === 'code' ? 'active' : ''}" data-diff="code">code</button>
            </div>
          </div>
          <div class="tt-config-divider"></div>
          <div class="tt-config-group">
            <span class="tt-config-label">sound</span>
            <div class="tt-config-pills">
              <button class="tt-pill ${soundEngine.enabled && soundEngine.switchType === 'thock' ? 'active' : ''}" data-sound="thock">thock</button>
              <button class="tt-pill ${soundEngine.enabled && soundEngine.switchType === 'clicky' ? 'active' : ''}" data-sound="clicky">clicky</button>
              <button class="tt-pill ${soundEngine.enabled && soundEngine.switchType === 'cyber' ? 'active' : ''}" data-sound="cyber">cyber</button>
              <button class="tt-pill ${!soundEngine.enabled ? 'active' : ''}" data-sound="mute">mute</button>
            </div>
          </div>
        </div>

        <!-- Timer display -->
        <div class="tt-timer-row">
          <div class="tt-timer" id="tt-timer">${this.timeLimit}</div>
        </div>

        <!-- Words display -->
        <div class="tt-words-wrapper" id="tt-words-wrapper">
          <div class="tt-words" id="tt-words"></div>
          <div class="tt-focus-warning" id="tt-focus-warning">
            <span>👆 Click here or start typing to focus</span>
          </div>
        </div>

        <!-- Hidden input for mobile keyboards -->
        <input type="text" class="tt-hidden-input" id="tt-hidden-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />

        <!-- Live stats -->
        <div class="tt-live-stats" id="tt-live-stats">
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="tt-live-wpm">0</span>
            <span class="tt-live-stat-label">wpm</span>
          </div>
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="tt-live-acc">100</span>
            <span class="tt-live-stat-label">accuracy</span>
          </div>
        </div>

        <!-- Restart hint -->
        <div class="tt-hint">
          <span>Press <kbd>Tab</kbd> + <kbd>Enter</kbd> to restart</span>
        </div>

        <!-- Results (hidden initially) -->
        <div class="tt-results" id="tt-results" style="display:none;"></div>
      </div>
    `;
  }

  attachEvents() {
    // Back button
    document.getElementById('tt-back-btn')?.addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Learn button
    document.getElementById('tt-learn-btn')?.addEventListener('click', () => {
      this.destroy();
      if (this.onLearn) this.onLearn();
    });

    // Leaderboard button
    document.getElementById('tt-leaderboard-btn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('manifesto-open-leaderboard'));
    });

    // Time pills
    this.container.querySelectorAll('[data-time]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.isRunning) return;
        const timeVal = btn.dataset.time;
        this.timeLimit = timeVal === 'Infinity' ? Infinity : parseInt(timeVal, 10);
        this.timeLeft = this.timeLimit;
        this.reset();
      });
    });

    // Difficulty pills
    this.container.querySelectorAll('[data-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.isRunning) return;
        this.difficulty = btn.dataset.diff;
        this.reset();
      });
    });

    // Sound pills
    this.container.querySelectorAll('[data-sound]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const soundType = btn.dataset.sound;
        if (soundType === 'mute') {
          soundEngine.enabled = false;
        } else {
          soundEngine.enabled = true;
          soundEngine.switchType = soundType;
          soundEngine.playKeySound(false, false);
        }
        this.reset();
      });
    });

    // Click on words area to focus
    document.getElementById('tt-words-wrapper')?.addEventListener('click', () => {
      this.focusInput();
    });

    // Hidden input for capturing keys
    const input = document.getElementById('tt-hidden-input');
    if (input) {
      input.addEventListener('keydown', this.handleKeyDown);
      input.addEventListener('focus', () => {
        document.getElementById('tt-focus-warning')?.classList.add('hidden');
        document.getElementById('tt-words')?.classList.remove('blurred');
      });
      input.addEventListener('blur', () => {
        if (!this.isFinished) {
          document.getElementById('tt-focus-warning')?.classList.remove('hidden');
          document.getElementById('tt-words')?.classList.add('blurred');
        }
      });
    }

    // Tab+Enter restart
    document.addEventListener('keydown', this._globalKeyHandler = (e) => {
      if (e.key === 'Tab' && !this.isFinished) {
        e.preventDefault();
      }
      if (e.key === 'Enter' && this._tabPressed) {
        this.reset();
      }
      if (e.key === 'Tab') {
        this._tabPressed = true;
        setTimeout(() => { this._tabPressed = false; }, 500);
      }
    });

    // XP gained listener
    window.addEventListener('manifesto-xp-gained', this.handleXPGained);
  }

  handleXPGained(e) {
    const { xp, newRank } = e.detail;
    const badge = document.getElementById('tt-xp-badge');
    if (badge) {
      badge.querySelector('.tt-xp-icon').textContent = newRank.icon;
      badge.querySelector('.tt-xp-value').textContent = `${xp} XP`;
      
      // Pop animation
      badge.classList.remove('pop');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('pop');
    }
  }



  handleKeyDown(e) {
    if (this.isFinished) return;

    // Prevent default for most keys
    if (e.key !== 'Tab' && e.key !== 'F5' && e.key !== 'F12' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }

    if (e.key === 'Backspace') {
      this.handleBackspace(e.ctrlKey);
      return;
    }

    if (e.key === ' ') {
      this.handleSpace();
      return;
    }

    // Only printable characters
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.handleChar(e.key);
    }
  }

  handleChar(char) {
    if (!this.isRunning && !this.isFinished) {
      this.startTimer();
    }

    const wi = this.currentWordIndex;
    if (wi >= this.words.length) return;

    if (!this.typed[wi]) this.typed[wi] = '';
    this.typed[wi] += char;
    this.currentCharIndex = this.typed[wi].length;

    // Track accuracy
    this.totalChars++;
    const expectedChar = this.words[wi][this.currentCharIndex - 1];
    if (char === expectedChar) {
      this.correctChars++;
      soundEngine.playKeySound(false, false);
    } else {
      soundEngine.playKeySound(false, true);
    }

    this.renderWords();
    this.updateLiveStats();
  }

  handleSpace() {
    if (!this.isRunning) return;

    soundEngine.playKeySound(true, false);

    const wi = this.currentWordIndex;
    if (!this.typed[wi] || this.typed[wi].length === 0) return;

    // Check word correctness
    if (this.typed[wi] === this.words[wi]) {
      this.wordStatuses[wi] = 'correct';
      this.correctWords++;
      
      // Earn live XP!
      const wordLength = this.words[wi].length;
      const xpEarned = Math.ceil(wordLength / 2); // 1 XP per 2 chars roughly
      addXP(xpEarned);
    } else {
      this.wordStatuses[wi] = 'incorrect';
      this.incorrectWords++;
    }

    this.currentWordIndex++;
    this.currentCharIndex = 0;

    // Infinite mode: append more words if we are close to the end
    if (this.timeLimit === Infinity && this.words.length - this.currentWordIndex < 20) {
      const pool = WORD_POOLS[this.difficulty] || WORD_POOLS.medium;
      for (let i = 0; i < 30; i++) {
        this.words.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      // Expand arrays
      this.typed.push(...new Array(30).fill(''));
      this.wordStatuses.push(...new Array(30).fill('pending'));
    }

    // If we've typed all words (timed mode), finish
    if (this.currentWordIndex >= this.words.length) {
      this.finish();
      return;
    }

    this.renderWords();
    this.updateLiveStats();
    this.scrollToCurrentWord();
  }

  handleBackspace(ctrlPressed) {
    const wi = this.currentWordIndex;

    if (ctrlPressed) {
      // Ctrl+Backspace: delete entire current word
      this.typed[wi] = '';
      this.currentCharIndex = 0;
    } else {
      if (!this.typed[wi] || this.typed[wi].length === 0) {
        // Go back to previous word if it was incorrect
        if (wi > 0 && this.wordStatuses[wi - 1] === 'incorrect') {
          this.currentWordIndex--;
          this.wordStatuses[this.currentWordIndex] = 'pending';
          this.incorrectWords--;
          this.currentCharIndex = this.typed[this.currentWordIndex]?.length || 0;
        }
      } else {
        this.typed[wi] = this.typed[wi].slice(0, -1);
        this.currentCharIndex = this.typed[wi].length;
      }
    }

    this.renderWords();
  }

  generateWords() {
    const pool = WORD_POOLS[this.difficulty] || WORD_POOLS.medium;
    this.words = [];
    for (let i = 0; i < this.wordCount; i++) {
      this.words.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    this.typed = new Array(this.words.length).fill('');
    this.wordStatuses = new Array(this.words.length).fill('pending');
  }

  renderWords() {
    const wordsEl = document.getElementById('tt-words');
    if (!wordsEl) return;

    let html = '';
    this.words.forEach((word, wi) => {
      const isCurrent = wi === this.currentWordIndex;
      const typedWord = this.typed[wi] || '';
      const status = this.wordStatuses[wi];

      let wordClass = 'tt-word';
      if (status === 'correct') wordClass += ' correct';
      if (status === 'incorrect') wordClass += ' incorrect';
      if (isCurrent) wordClass += ' current';

      let chars = '';
      for (let ci = 0; ci < word.length; ci++) {
        let charClass = 'tt-char';
        if (isCurrent || status !== 'pending') {
          if (ci < typedWord.length) {
            charClass += typedWord[ci] === word[ci] ? ' correct' : ' incorrect';
          } else if (isCurrent && ci === typedWord.length) {
            charClass += ' cursor';
          }
        }
        chars += `<span class="${charClass}">${word[ci]}</span>`;
      }

      // Extra typed chars (overflow)
      if (typedWord.length > word.length) {
        for (let ci = word.length; ci < typedWord.length; ci++) {
          chars += `<span class="tt-char extra">${typedWord[ci]}</span>`;
        }
      }

      // Cursor at end (after all chars)
      if (isCurrent && typedWord.length >= word.length) {
        // Already handled by extra chars or last char position
      }

      html += `<span class="${wordClass}">${chars}</span>`;
    });

    wordsEl.innerHTML = html;
  }

  scrollToCurrentWord() {
    const wordsEl = document.getElementById('tt-words');
    const currentWordEl = wordsEl?.querySelector('.tt-word.current');
    if (!currentWordEl || !wordsEl) return;

    // Use offsetTop which is stable and ignores CSS transforms
    const offset = currentWordEl.offsetTop;
    
    // Line height is ~45px. If we are on the 3rd line or below (offset > 45),
    // we scroll up so the current line becomes the second visible line.
    if (offset > 45) {
      wordsEl.style.transform = `translateY(-${offset - 45}px)`;
    } else {
      wordsEl.style.transform = `translateY(0px)`;
    }
  }

  startTimer() {
    this.isRunning = true;
    this.startTime = Date.now();
    this.timeLeft = this.timeLimit;

    // Hide config
    document.getElementById('tt-config')?.classList.add('hidden');

    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.timeLeft = this.timeLimit === Infinity ? elapsed : Math.max(0, this.timeLimit - elapsed);
      this.updateTimerDisplay();
      this.updateLiveStats();

      if (this.timeLimit !== Infinity && this.timeLeft <= 0) {
        this.finish();
      }
    }, 100);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('tt-timer');
    if (timerEl) {
      if (this.timeLimit === Infinity) {
        // Format as MM:SS for infinite mode
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        timerEl.classList.remove('warning');
      } else {
        timerEl.textContent = this.timeLeft;
        if (this.timeLeft <= 5 && this.isRunning) {
          timerEl.classList.add('warning');
        } else {
          timerEl.classList.remove('warning');
        }
      }
    }
  }

  updateLiveStats() {
    if (!this.isRunning) return;

    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const wpm = elapsed > 0 ? Math.round((this.correctChars / 5) / elapsed) : 0;
    const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 100;

    const wpmEl = document.getElementById('tt-live-wpm');
    const accEl = document.getElementById('tt-live-acc');
    if (wpmEl) wpmEl.textContent = wpm;
    if (accEl) accEl.textContent = accuracy;
  }

  finish() {
    this.isFinished = true;
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);

    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((this.correctChars / 5) / minutes) : 0;
    const rawWpm = minutes > 0 ? Math.round((this.totalChars / 5) / minutes) : 0;
    const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 100;
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    // Save best score
    this.saveBestScore(wpm, accuracy);

    const bestScore = this.getBestScore();

    // Hide typing area, show results
    document.getElementById('tt-words-wrapper')?.classList.add('hidden');
    document.getElementById('tt-live-stats')?.classList.add('hidden');
    document.getElementById('tt-timer-row')?.classList.add('hidden');
    document.querySelector('.tt-hint')?.classList.add('hidden');

    const resultsEl = document.getElementById('tt-results');
    if (resultsEl) {
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = `
        <div class="tt-results-inner">
          <div class="tt-results-main">
            <div class="tt-result-big">
              <span class="tt-result-big-value">${wpm}</span>
              <span class="tt-result-big-label">wpm</span>
            </div>
            <div class="tt-result-big">
              <span class="tt-result-big-value tt-acc-value">${accuracy}%</span>
              <span class="tt-result-big-label">accuracy</span>
            </div>
          </div>

          <div class="tt-results-details">
            <div class="tt-result-item">
              <span class="tt-result-item-label">raw wpm</span>
              <span class="tt-result-item-value">${rawWpm}</span>
            </div>
            <div class="tt-result-item">
              <span class="tt-result-item-label">characters</span>
              <span class="tt-result-item-value">
                <span style="color: var(--success)">${this.correctChars}</span> /
                <span style="color: var(--danger)">${this.totalChars - this.correctChars}</span>
              </span>
            </div>
            <div class="tt-result-item">
              <span class="tt-result-item-label">words</span>
              <span class="tt-result-item-value">
                <span style="color: var(--success)">${this.correctWords}</span> /
                <span style="color: var(--danger)">${this.incorrectWords}</span>
              </span>
            </div>
            <div class="tt-result-item">
              <span class="tt-result-item-label">time</span>
              <span class="tt-result-item-value">${Math.round(elapsed)}s</span>
            </div>
            <div class="tt-result-item">
              <span class="tt-result-item-label">difficulty</span>
              <span class="tt-result-item-value">${this.difficulty}</span>
            </div>
            ${bestScore ? `
            <div class="tt-result-item tt-best">
              <span class="tt-result-item-label">🏆 personal best</span>
              <span class="tt-result-item-value">${bestScore.wpm} wpm</span>
            </div>` : ''}
          </div>

          <div class="tt-results-quote">${quote}</div>

          <div class="tt-results-actions">
            <button class="btn btn-primary tt-restart-btn" id="tt-restart-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              <span>Try Again</span>
            </button>
            <button class="btn btn-secondary" id="tt-back-results-btn">
              <span>Back to Goals</span>
            </button>
          </div>
        </div>
      `;

      // Restart button
      document.getElementById('tt-restart-btn')?.addEventListener('click', () => {
        this.reset();
      });

      // Back button in results
      document.getElementById('tt-back-results-btn')?.addEventListener('click', () => {
        this.destroy();
        if (this.onExit) this.onExit();
      });
    }
  }

  saveBestScore(wpm, accuracy) {
    try {
      const key = `manifesto_typing_best_${this.timeLimit}_${this.difficulty}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      if (!existing.wpm || wpm > existing.wpm) {
        localStorage.setItem(key, JSON.stringify({ wpm, accuracy, date: new Date().toISOString() }));
      }

      // Sync global best to cloud
      const globalKey = `manifesto_typing_global_best`;
      const globalBest = parseInt(localStorage.getItem(globalKey) || '0', 10);
      if (wpm > globalBest) {
        localStorage.setItem(globalKey, wpm.toString());
        saveTypingStats(wpm, undefined);
      }
    } catch (e) { /* ignore */ }
  }

  getBestScore() {
    try {
      const key = `manifesto_typing_best_${this.timeLimit}_${this.difficulty}`;
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) { return null; }
  }

  reset() {
    if (this.timer) clearInterval(this.timer);
    this.isRunning = false;
    this.isFinished = false;
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.correctWords = 0;
    this.incorrectWords = 0;
    this.timeLeft = this.timeLimit;
    this.startTime = null;
    this._tabPressed = false;

    this.render();
  }

  focusInput() {
    document.getElementById('tt-hidden-input')?.focus();
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    if (this._globalKeyHandler) {
      document.removeEventListener('keydown', this._globalKeyHandler);
    }
    window.removeEventListener('manifesto-xp-gained', this.handleXPGained);
    saveTypingStats(undefined, getXP());
    this.container.innerHTML = '';
  }
}
