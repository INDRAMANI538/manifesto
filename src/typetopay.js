// ============================================
// MANIFESTO — Type to Pay
// Earn ₹1 per ~150 correctly typed words
// ============================================

import { soundEngine } from './audio.js';
import { addXP, getXP, getRankForXP } from './gamify.js';
import { WORD_POOLS } from './typing.js';
import {
  loadEarningsLocal,
  saveEarningsLocal,
  saveEarningsToCloud,
  loadEarningsFromCloud,
  requestCashout,
  getUserCashouts,
} from './store.js';

const WORDS_PER_RUPEE = {
  easy: 300,
  medium: 150,
  hard: 100
};

function getRatePerWord(difficulty) {
  return 1 / (WORDS_PER_RUPEE[difficulty] || 150);
}

export class TypeToPay {
  constructor(container) {
    this.container = container;
    this.words = [];
    this.typed = [];
    this.wordStatuses = [];
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.correctWords = 0;
    this.incorrectWords = 0;
    this.isRunning = false;
    this.startTime = null;
    this.timer = null;
    this.difficulty = 'medium';
    this.onExit = null;

    // Earnings state
    this.sessionWords = 0;
    this.sessionEarnings = 0;
    this.lifetimeWords = 0;
    this.lifetimeEarnings = 0;

    // View state
    this.showDashboard = false;
    this.cashouts = [];
    this.cashoutLoading = false;

    // Cloud sync debounce
    this._syncTimeout = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  async init() {
    // Load earnings from cloud first, fallback to local
    const cloudEarnings = await loadEarningsFromCloud();
    if (cloudEarnings) {
      this.lifetimeWords = cloudEarnings.totalWords || 0;
      this.lifetimeEarnings = cloudEarnings.totalEarnings || 0;
      saveEarningsLocal(this.lifetimeWords, this.lifetimeEarnings);
    } else {
      const local = loadEarningsLocal();
      this.lifetimeWords = local.totalWords;
      this.lifetimeEarnings = local.totalEarnings;
    }
    
    // Load cashouts to calculate available balance for main screen
    this.cashouts = await getUserCashouts();

    this.render();
  }

  render() {
    if (this.showDashboard) {
      this.renderDashboard();
      return;
    }
    this.renderTypingView();
  }

  renderTypingView() {
    const xp = getXP();
    const rank = getRankForXP(xp);

    const totalCashedOut = this.cashouts
      .filter(c => c.status !== 'rejected')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const availableBalance = Math.max(0, this.lifetimeEarnings - totalCashedOut);

    this.container.innerHTML = `
      <div class="ttp-container" id="ttp-container">
        <!-- Top bar -->
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="ttp-back-btn" title="Back to goals">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Back</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">💰</span>
            <span class="tt-brand-text">Type to Pay</span>
          </div>
          <div class="tt-spacer"></div>
          <div class="tt-xp-badge" id="ttp-xp-badge">
            <span class="tt-xp-icon">${rank.icon}</span>
            <span class="tt-xp-value">${xp} XP</span>
          </div>
          <button class="btn btn-secondary" id="ttp-dashboard-btn">
            <span>📊</span>
            <span>Earnings</span>
          </button>
        </div>

        <!-- Earnings Bar -->
        <div class="ttp-earnings-bar" id="ttp-earnings-bar">
          <div class="ttp-earnings-item">
            <span class="ttp-earnings-label">Session Words</span>
            <span class="ttp-earnings-value" id="ttp-session-words">0</span>
          </div>
          <div class="ttp-earnings-divider"></div>
          <div class="ttp-earnings-item ttp-earnings-highlight">
            <span class="ttp-earnings-label">Session Earnings</span>
            <span class="ttp-earnings-value ttp-rupee" id="ttp-session-earnings">₹0.00</span>
          </div>
          <div class="ttp-earnings-divider"></div>
          <div class="ttp-earnings-item">
            <span class="ttp-earnings-label">Total Earnings</span>
            <span class="ttp-earnings-value ttp-rupee-lifetime" id="ttp-lifetime-earnings">₹${availableBalance.toFixed(2)}</span>
          </div>
          <div class="ttp-earnings-divider"></div>
          <div class="ttp-earnings-item">
            <span class="ttp-earnings-label">Rate</span>
            <span class="ttp-earnings-value ttp-rate" id="ttp-rate-display">₹1 / ${WORDS_PER_RUPEE[this.difficulty] || 150} words</span>
          </div>
        </div>

        <!-- Difficulty config -->
        <div class="tt-config" id="ttp-config">
          <div class="tt-config-group">
            <span class="tt-config-label">difficulty</span>
            <div class="tt-config-pills">
              <button class="tt-pill ${this.difficulty === 'easy' ? 'active' : ''}" data-diff="easy">easy</button>
              <button class="tt-pill ${this.difficulty === 'medium' ? 'active' : ''}" data-diff="medium">medium</button>
              <button class="tt-pill ${this.difficulty === 'hard' ? 'active' : ''}" data-diff="hard">hard</button>
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

        <!-- Timer (elapsed) -->
        <div class="tt-timer-row">
          <div class="tt-timer" id="ttp-timer">00:00</div>
        </div>

        <!-- Words display -->
        <div class="tt-words-wrapper" id="ttp-words-wrapper">
          <div class="tt-words" id="ttp-words"></div>
          <div class="tt-focus-warning" id="ttp-focus-warning">
            <span>👆 Click here or start typing to begin earning</span>
          </div>
        </div>

        <!-- Hidden input for keyboard capture -->
        <input type="text" class="tt-hidden-input" id="ttp-hidden-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />

        <!-- Live stats -->
        <div class="tt-live-stats" id="ttp-live-stats">
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="ttp-live-wpm">0</span>
            <span class="tt-live-stat-label">wpm</span>
          </div>
          <div class="tt-live-stat">
            <span class="tt-live-stat-value" id="ttp-live-acc">100</span>
            <span class="tt-live-stat-label">accuracy</span>
          </div>
          <div class="tt-live-stat ttp-live-earn">
            <span class="tt-live-stat-value ttp-rupee" id="ttp-live-earn">₹0.00</span>
            <span class="tt-live-stat-label">earned</span>
          </div>
        </div>

        <!-- Hint -->
        <div class="tt-hint">
          <span>Type correctly to earn money • Only correct words count • Press <kbd>Tab</kbd> + <kbd>Enter</kbd> to restart</span>
        </div>

        <!-- Floating stop button -->
        <button class="ttp-stop-btn" id="ttp-stop-btn" style="display:none;">
          <span>⏹️</span>
          <span>Stop & Save Earnings</span>
        </button>
      </div>
    `;

    this.generateWords();
    this.renderWords();
    this.attachTypingEvents();
    this.focusInput();
  }

  renderDashboard() {
    const availableBalance = this.lifetimeEarnings;
    const totalCashedOut = this.cashouts
      .filter(c => c.status !== 'rejected')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const statusBadge = (status) => {
      const map = {
        pending: { label: 'Pending', icon: '🟡', cls: 'ttp-badge-pending' },
        processing: { label: 'Processing', icon: '🔵', cls: 'ttp-badge-processing' },
        approved: { label: 'Approved', icon: '🟢', cls: 'ttp-badge-approved' },
        done: { label: 'Done', icon: '✅', cls: 'ttp-badge-done' },
        rejected: { label: 'Rejected', icon: '🔴', cls: 'ttp-badge-rejected' },
      };
      const s = map[status] || map.pending;
      return `<span class="ttp-status-badge ${s.cls}">${s.icon} ${s.label}</span>`;
    };

    const cashoutRows = this.cashouts.length > 0
      ? this.cashouts.map(c => {
          const date = c.requestedAt?.toDate?.()
            ? c.requestedAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Pending...';
          return `
            <tr>
              <td>₹${(c.amount || 0).toFixed(2)}</td>
              <td class="ttp-upi-cell">${c.upiId || '-'}</td>
              <td>${statusBadge(c.status)}</td>
              <td>${date}</td>
            </tr>
          `;
        }).join('')
      : `<tr><td colspan="4" class="ttp-empty-row">No cashout requests yet</td></tr>`;

    const netBalance = Math.max(0, availableBalance - totalCashedOut);

    this.container.innerHTML = `
      <div class="ttp-container ttp-dashboard-view" id="ttp-container">
        <!-- Top bar -->
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="ttp-dash-back-btn" title="Back to typing">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Back to Typing</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">📊</span>
            <span class="tt-brand-text">Earnings Dashboard</span>
          </div>
          <div class="tt-spacer"></div>
        </div>

        <!-- Stats cards -->
        <div class="ttp-dash-cards">
          <div class="ttp-dash-card">
            <div class="ttp-dash-card-icon">⌨️</div>
            <div class="ttp-dash-card-value">${this.lifetimeWords.toLocaleString()}</div>
            <div class="ttp-dash-card-label">Total Words Typed</div>
          </div>
          <div class="ttp-dash-card ttp-dash-card-highlight">
            <div class="ttp-dash-card-icon">💰</div>
            <div class="ttp-dash-card-value">₹${this.lifetimeEarnings.toFixed(2)}</div>
            <div class="ttp-dash-card-label">Total Earned</div>
          </div>
          <div class="ttp-dash-card">
            <div class="ttp-dash-card-icon">📤</div>
            <div class="ttp-dash-card-value">₹${totalCashedOut.toFixed(2)}</div>
            <div class="ttp-dash-card-label">Total Cashed Out</div>
          </div>
          <div class="ttp-dash-card">
            <div class="ttp-dash-card-icon">📈</div>
            <div class="ttp-dash-card-value">₹${netBalance.toFixed(2)}</div>
            <div class="ttp-dash-card-label">Available Balance</div>
          </div>
        </div>

        <!-- Cashout section -->
        <div class="ttp-cashout-section">
          <div class="ttp-cashout-header">
            <h3>💸 Cash Out</h3>
            <button class="btn btn-primary ttp-cashout-btn" id="ttp-cashout-btn" ${netBalance < 1 ? 'disabled' : ''}>
              Request Cashout
            </button>
          </div>
          ${netBalance < 1
            ? `<div class="ttp-cashout-notice">⚠️ Minimum cashout amount is ₹1. Keep typing to earn more!</div>`
            : ''
          }
        </div>

        <!-- Cashout history -->
        <div class="ttp-history-section">
          <h3>📋 Cashout History</h3>
          <div class="ttp-history-table-wrapper">
            <table class="ttp-history-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>UPI ID</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${cashoutRows}
              </tbody>
            </table>
          </div>

          <!-- Status pipeline legend -->
          <div class="ttp-status-pipeline">
            <div class="ttp-pipeline-step">🟡 Pending</div>
            <div class="ttp-pipeline-arrow">→</div>
            <div class="ttp-pipeline-step">🔵 Processing</div>
            <div class="ttp-pipeline-arrow">→</div>
            <div class="ttp-pipeline-step">🟢 Approved</div>
            <div class="ttp-pipeline-arrow">→</div>
            <div class="ttp-pipeline-step">✅ Done</div>
          </div>
        </div>

        <!-- Cashout Modal (hidden) -->
        <div class="ttp-cashout-modal" id="ttp-cashout-modal" style="display:none;">
          <div class="ttp-cashout-modal-content">
            <h3>💸 Request Cashout</h3>
            <div class="ttp-cashout-form">
              <label>
                <span>Amount (₹)</span>
                <input type="number" id="ttp-cashout-amount" min="1" max="${Math.floor(netBalance)}" value="${Math.min(Math.floor(netBalance), Math.floor(netBalance))}" step="1" />
              </label>
              <label>
                <span>UPI ID</span>
                <input type="text" id="ttp-cashout-upi" placeholder="yourname@upi" />
              </label>
              <div class="ttp-cashout-actions">
                <button class="btn btn-primary" id="ttp-cashout-submit">Submit Request</button>
                <button class="btn btn-secondary" id="ttp-cashout-cancel">Cancel</button>
              </div>
              <div class="ttp-cashout-error" id="ttp-cashout-error" style="display:none;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachDashboardEvents();
  }

  attachDashboardEvents() {
    document.getElementById('ttp-dash-back-btn')?.addEventListener('click', () => {
      this.showDashboard = false;
      this.render();
    });

    document.getElementById('ttp-cashout-btn')?.addEventListener('click', () => {
      const modal = document.getElementById('ttp-cashout-modal');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('ttp-cashout-cancel')?.addEventListener('click', () => {
      const modal = document.getElementById('ttp-cashout-modal');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('ttp-cashout-submit')?.addEventListener('click', async () => {
      const amountEl = document.getElementById('ttp-cashout-amount');
      const upiEl = document.getElementById('ttp-cashout-upi');
      const errorEl = document.getElementById('ttp-cashout-error');
      const amount = parseFloat(amountEl?.value || '0');
      const upiId = upiEl?.value?.trim() || '';

      if (!upiId || !upiId.includes('@')) {
        if (errorEl) {
          errorEl.textContent = 'Please enter a valid UPI ID (e.g. yourname@upi)';
          errorEl.style.display = 'block';
        }
        return;
      }
      if (amount < 1) {
        if (errorEl) {
          errorEl.textContent = 'Minimum cashout amount is ₹1';
          errorEl.style.display = 'block';
        }
        return;
      }

      try {
        const submitBtn = document.getElementById('ttp-cashout-submit');
        if (submitBtn) {
          submitBtn.textContent = 'Submitting...';
          submitBtn.disabled = true;
        }

        await requestCashout(amount, upiId);

        // Refresh cashouts
        this.cashouts = await getUserCashouts();
        this.showDashboard = true;
        this.render();
      } catch (e) {
        if (errorEl) {
          errorEl.textContent = 'Failed to submit: ' + e.message;
          errorEl.style.display = 'block';
        }
      }
    });
  }

  generateWords() {
    const pool = WORD_POOLS[this.difficulty] || WORD_POOLS.medium;
    this.words = [];
    this.typed = [];
    this.wordStatuses = [];
    for (let i = 0; i < 80; i++) {
      this.words.push(pool[Math.floor(Math.random() * pool.length)]);
      this.typed.push('');
      this.wordStatuses.push('pending');
    }
  }

  renderWords() {
    const wordsEl = document.getElementById('ttp-words');
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

      if (typedWord.length > word.length) {
        for (let ci = word.length; ci < typedWord.length; ci++) {
          chars += `<span class="tt-char extra">${typedWord[ci]}</span>`;
        }
      }

      html += `<span class="${wordClass}">${chars}</span>`;
    });

    wordsEl.innerHTML = html;
  }

  scrollToCurrentWord() {
    const wordsEl = document.getElementById('ttp-words');
    const currentWordEl = wordsEl?.querySelector('.tt-word.current');
    if (!currentWordEl || !wordsEl) return;

    const offset = currentWordEl.offsetTop;
    if (offset > 45) {
      wordsEl.style.transform = `translateY(-${offset - 45}px)`;
    } else {
      wordsEl.style.transform = `translateY(0px)`;
    }
  }

  attachTypingEvents() {
    document.getElementById('ttp-back-btn')?.addEventListener('click', () => {
      this.saveAndSync();
      this.destroy();
      if (this.onExit) this.onExit();
    });

    document.getElementById('ttp-dashboard-btn')?.addEventListener('click', async () => {
      this.stopSession();
      this.saveAndSync();
      this.cashoutLoading = true;
      this.cashouts = await getUserCashouts();
      this.cashoutLoading = false;
      this.showDashboard = true;
      this.render();
    });

    this.container.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isRunning) return;
        this.difficulty = btn.dataset.diff;
        
        // Update rate display in UI dynamically
        const rateEl = document.getElementById('ttp-rate-display');
        if (rateEl) {
          rateEl.textContent = `₹1 / ${WORDS_PER_RUPEE[this.difficulty] || 150} words`;
        }
        
        this.resetSession();
      });
    });

    this.container.querySelectorAll('[data-sound]').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundType = btn.dataset.sound;
        if (soundType === 'mute') {
          soundEngine.enabled = false;
        } else {
          soundEngine.enabled = true;
          soundEngine.switchType = soundType;
          soundEngine.playKeySound(false, false);
        }
        this.render();
      });
    });

    document.getElementById('ttp-stop-btn')?.addEventListener('click', () => {
      this.stopSession();
      this.saveAndSync();
      this.resetSession();
    });

    document.getElementById('ttp-words-wrapper')?.addEventListener('click', () => {
      this.focusInput();
    });

    const input = document.getElementById('ttp-hidden-input');
    if (input) {
      input.addEventListener('keydown', this.handleKeyDown);
      input.addEventListener('focus', () => {
        document.getElementById('ttp-focus-warning')?.classList.add('hidden');
        document.getElementById('ttp-words')?.classList.remove('blurred');
      });
      input.addEventListener('blur', () => {
        if (this.isRunning) return;
        document.getElementById('ttp-focus-warning')?.classList.remove('hidden');
        document.getElementById('ttp-words')?.classList.add('blurred');
      });
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this._tabPressed = true;
      return;
    }
    if (e.key === 'Enter' && this._tabPressed) {
      e.preventDefault();
      this._tabPressed = false;
      this.stopSession();
      this.saveAndSync();
      this.resetSession();
      return;
    }
    this._tabPressed = false;

    if (e.key === 'Escape') {
      this.stopSession();
      this.saveAndSync();
      this.destroy();
      if (this.onExit) this.onExit();
      return;
    }

    if (e.ctrlKey && e.key !== 'Backspace') return;
    if (e.altKey || e.metaKey) return;

    if (!this.isRunning && e.key.length === 1) {
      this.startTimer();
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.handleBackspace(e.ctrlKey);
    } else if (e.key === ' ') {
      e.preventDefault();
      this.handleSpace();
    } else if (e.key.length === 1) {
      e.preventDefault();
      this.handleChar(e.key);
    }
  }

  handleChar(char) {
    const wi = this.currentWordIndex;
    if (!this.typed[wi]) this.typed[wi] = '';
    this.typed[wi] += char;
    this.currentCharIndex = this.typed[wi].length;
    this.totalChars++;

    if (this.currentCharIndex <= this.words[wi].length) {
      if (char === this.words[wi][this.currentCharIndex - 1]) {
        this.correctChars++;
      }
    }

    if (soundEngine.enabled) {
      soundEngine.playKeySound(false, false);
    }

    this.renderWords();
    this.scrollToCurrentWord();
  }

  handleSpace() {
    const wi = this.currentWordIndex;
    if (!this.typed[wi] || this.typed[wi].length === 0) return;

    if (this.typed[wi] === this.words[wi]) {
      this.wordStatuses[wi] = 'correct';
      this.correctWords++;
      this.sessionWords++;

      const rate = getRatePerWord(this.difficulty);
      this.sessionEarnings += rate;
      this.updateEarningsDisplay();

      const wordLength = this.words[wi].length;
      const xpEarned = Math.ceil(wordLength / 2);
      addXP(xpEarned);
    } else {
      this.wordStatuses[wi] = 'incorrect';
      this.incorrectWords++;
    }

    this.currentWordIndex++;
    this.currentCharIndex = 0;

    // Infinite: add more words
    if (this.words.length - this.currentWordIndex < 20) {
      const pool = WORD_POOLS[this.difficulty] || WORD_POOLS.medium;
      for (let i = 0; i < 30; i++) {
        this.words.push(pool[Math.floor(Math.random() * pool.length)]);
        this.typed.push('');
        this.wordStatuses.push('pending');
      }
    }

    this.renderWords();
    this.updateLiveStats();
    this.scrollToCurrentWord();

    // Debounced cloud save every 30 correct words
    if (this.sessionWords > 0 && this.sessionWords % 30 === 0) {
      this.debouncedSave();
    }
  }

  handleBackspace(ctrlPressed) {
    const wi = this.currentWordIndex;

    if (ctrlPressed) {
      this.typed[wi] = '';
      this.currentCharIndex = 0;
    } else {
      if (!this.typed[wi] || this.typed[wi].length === 0) {
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
    this.scrollToCurrentWord();
  }

  startTimer() {
    this.isRunning = true;
    this.startTime = Date.now();

    document.getElementById('ttp-config')?.classList.add('hidden');
    const stopBtn = document.getElementById('ttp-stop-btn');
    if (stopBtn) stopBtn.style.display = 'flex';

    this.timer = setInterval(() => {
      this.updateTimerDisplay();
      this.updateLiveStats();
    }, 100);
  }

  stopSession() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('ttp-timer');
    if (!timerEl || !this.startTime) return;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateLiveStats() {
    if (!this.isRunning || !this.startTime) return;
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    const wpm = elapsed > 0 ? Math.round(this.correctWords / elapsed) : 0;
    const acc = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 100;

    const wpmEl = document.getElementById('ttp-live-wpm');
    const accEl = document.getElementById('ttp-live-acc');
    if (wpmEl) wpmEl.textContent = wpm;
    if (accEl) accEl.textContent = acc;
  }

  updateEarningsDisplay() {
    const sessionWordsEl = document.getElementById('ttp-session-words');
    const sessionEarnEl = document.getElementById('ttp-session-earnings');
    const lifetimeEarnEl = document.getElementById('ttp-lifetime-earnings');
    const liveEarnEl = document.getElementById('ttp-live-earn');

    if (sessionWordsEl) sessionWordsEl.textContent = this.sessionWords;
    if (sessionEarnEl) {
      sessionEarnEl.textContent = `₹${this.sessionEarnings.toFixed(2)}`;
      sessionEarnEl.classList.add('ttp-pulse');
      setTimeout(() => sessionEarnEl.classList.remove('ttp-pulse'), 300);
    }
    if (lifetimeEarnEl) {
      const totalCashedOut = this.cashouts
        .filter(c => c.status !== 'rejected')
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const availableBalance = Math.max(0, this.lifetimeEarnings - totalCashedOut);
      const total = availableBalance + this.sessionEarnings;
      lifetimeEarnEl.textContent = `₹${total.toFixed(2)}`;
    }
    if (liveEarnEl) {
      liveEarnEl.textContent = `₹${this.sessionEarnings.toFixed(2)}`;
    }
  }

  debouncedSave() {
    clearTimeout(this._syncTimeout);
    this._syncTimeout = setTimeout(() => {
      const totalWords = this.lifetimeWords + this.sessionWords;
      const totalEarnings = this.lifetimeEarnings + this.sessionEarnings;
      saveEarningsLocal(totalWords, totalEarnings);
      saveEarningsToCloud(totalWords, totalEarnings);
    }, 2000);
  }

  saveAndSync() {
    clearTimeout(this._syncTimeout);
    this.lifetimeWords += this.sessionWords;
    this.lifetimeEarnings += this.sessionEarnings;
    this.lifetimeEarnings = Math.round(this.lifetimeEarnings * 100) / 100;

    saveEarningsLocal(this.lifetimeWords, this.lifetimeEarnings);
    saveEarningsToCloud(this.lifetimeWords, this.lifetimeEarnings);

    this.sessionWords = 0;
    this.sessionEarnings = 0;
  }

  resetSession() {
    this.stopSession();
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.correctWords = 0;
    this.incorrectWords = 0;
    this.startTime = null;
    this._tabPressed = false;
    this.sessionWords = 0;
    this.sessionEarnings = 0;

    this.render();
  }

  focusInput() {
    document.getElementById('ttp-hidden-input')?.focus();
  }

  destroy() {
    this.stopSession();
    if (this.handleKeyDown) {
      document.getElementById('ttp-hidden-input')?.removeEventListener('keydown', this.handleKeyDown);
    }
    this.container.innerHTML = '';
  }
}
