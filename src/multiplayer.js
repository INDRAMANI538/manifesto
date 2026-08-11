import { getCurrentUID, createMatch, joinMatch, startMatchCountdown, listenToOpenMatches, listenToMatch, updateMatchState, finishMatch, cancelMatch } from './store.js';
import { WORD_POOLS } from './typing.js';
import { soundEngine } from './audio.js';
import { auth } from './firebase.js';

// ---- PRNG ----
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function getSeededWords(seed, count, difficulty) {
  const prng = mulberry32(seed);
  const pool = WORD_POOLS[difficulty] || WORD_POOLS['medium'];
  const words = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(prng() * pool.length);
    words.push(pool[idx]);
  }
  return words;
}

// ---- Lobby ----
export class MultiplayerLobby {
  constructor(container) {
    this.container = container;
    this.unsubscribeOpenMatches = null;
    this.unsubscribeMatch = null;
    this.currentMatchId = null;
    this.isHost = false;
    this.onMatchStart = null;
    this.onExit = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="mp-lobby">
        <div class="mp-header">
          <h2>⚔️ 1v1 Arena</h2>
          <button class="btn btn-ghost" id="mp-exit-btn">Close</button>
        </div>
        
        <div class="mp-content" id="mp-view-container">
          <!-- Views will be injected here -->
        </div>
      </div>
    `;

    document.getElementById('mp-exit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    this.showMatchList();
  }

  showMatchList() {
    const vc = document.getElementById('mp-view-container');
    if (!vc) return;

    vc.innerHTML = `
      <div class="mp-action-bar">
        <button class="btn btn-primary" id="mp-host-btn">👑 Host Match</button>
      </div>
      <div class="mp-match-list">
        <h3>Open Challenges</h3>
        <div id="mp-open-matches" class="mp-matches-grid">
          <div class="mp-loading">Looking for challengers...</div>
        </div>
      </div>
    `;

    document.getElementById('mp-host-btn').addEventListener('click', () => this.hostMatch());

    if (this.unsubscribeOpenMatches) this.unsubscribeOpenMatches();
    this.unsubscribeOpenMatches = listenToOpenMatches((matches) => {
      const grid = document.getElementById('mp-open-matches');
      if (!grid) return;
      
      const filtered = matches.filter(m => m.hostUid !== getCurrentUID());
      
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">No open matches right now. Be the first to host!</div>';
        return;
      }

      grid.innerHTML = filtered.map(m => `
        <div class="mp-match-card">
          <div class="mp-match-info">
            <div class="mp-host-name">${m.hostName || 'Anonymous'}</div>
            <div class="mp-match-settings">${m.settings.timeLimit}s • ${m.settings.difficulty}</div>
          </div>
          <button class="btn btn-secondary mp-join-btn" data-id="${m.id}">Join</button>
        </div>
      `).join('');

      grid.querySelectorAll('.mp-join-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.joinMatch(e.target.dataset.id));
      });
    });
  }

  async hostMatch() {
    try {
      this.isHost = true;
      this.currentMatchId = await createMatch();
      this.showWaitingRoom();
    } catch (e) {
      console.error(e);
      alert('Failed to host match.');
    }
  }

  async joinMatch(matchId) {
    try {
      this.isHost = false;
      this.currentMatchId = matchId;
      await joinMatch(matchId);
      this.showWaitingRoom();
    } catch (e) {
      console.error(e);
      alert('Failed to join match.');
    }
  }

  showWaitingRoom() {
    if (this.unsubscribeOpenMatches) {
      this.unsubscribeOpenMatches();
      this.unsubscribeOpenMatches = null;
    }

    const vc = document.getElementById('mp-view-container');
    if (!vc) return;

    vc.innerHTML = `
      <div class="mp-waiting-room">
        <h3>Waiting Room</h3>
        <div class="mp-players">
          <div class="mp-player">
            <span class="mp-player-label">Host</span>
            <span class="mp-player-name" id="mp-wr-host">Waiting...</span>
          </div>
          <div class="mp-vs">VS</div>
          <div class="mp-player">
            <span class="mp-player-label">Challenger</span>
            <span class="mp-player-name" id="mp-wr-guest">Waiting...</span>
          </div>
        </div>
        <div class="mp-waiting-actions" id="mp-wr-actions">
          <button class="btn btn-danger" id="mp-cancel-btn">Leave</button>
          ${this.isHost ? '<button class="btn btn-primary" id="mp-start-btn" disabled>Start Match</button>' : ''}
        </div>
      </div>
    `;

    document.getElementById('mp-cancel-btn').addEventListener('click', () => {
      if (this.isHost) cancelMatch(this.currentMatchId);
      this.currentMatchId = null;
      if (this.unsubscribeMatch) this.unsubscribeMatch();
      this.showMatchList();
    });

    if (this.isHost) {
      document.getElementById('mp-start-btn').addEventListener('click', () => {
        startMatchCountdown(this.currentMatchId);
      });
    }

    if (this.unsubscribeMatch) this.unsubscribeMatch();
    this.unsubscribeMatch = listenToMatch(this.currentMatchId, (matchData) => {
      if (!matchData) {
        // Match cancelled
        if (!this.isHost) alert('The host cancelled the match.');
        this.currentMatchId = null;
        if (this.unsubscribeMatch) this.unsubscribeMatch();
        this.showMatchList();
        return;
      }

      document.getElementById('mp-wr-host').textContent = matchData.hostName || 'Anonymous';
      document.getElementById('mp-wr-guest').textContent = matchData.guestName || 'Waiting...';

      if (this.isHost && matchData.guestUid) {
        const startBtn = document.getElementById('mp-start-btn');
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = 'Start Match! 🚀';
        }
      }

      if (matchData.status === 'playing') {
        // GO!
        if (this.unsubscribeMatch) this.unsubscribeMatch();
        if (this.onMatchStart) this.onMatchStart(matchData, this.isHost);
      }
    });
  }

  destroy() {
    if (this.unsubscribeOpenMatches) this.unsubscribeOpenMatches();
    if (this.unsubscribeMatch) this.unsubscribeMatch();
    this.container.innerHTML = '';
  }
}

// ---- Game ----
export class MultiplayerGame {
  constructor(container, matchData, isHost) {
    this.container = container;
    this.matchId = matchData.id;
    this.isHost = isHost;
    this.settings = matchData.settings;
    this.words = getSeededWords(this.settings.seed, 200, this.settings.difficulty);
    
    // My State
    this.myIndex = 0;
    this.myCharIndex = 0;
    this.myCorrectChars = 0;
    this.myTotalChars = 0;
    
    // Opponent State
    this.oppIndex = 0;
    
    this.timeLeft = this.settings.timeLimit;
    this.timer = null;
    this.syncTimer = null;
    this.unsubscribeMatch = null;
    this.onExit = null;
    
    this.isFinished = false;

    // We generate HTML for the words
    this.wordsHtml = this.words.map(w => '<div class="tt-word">' + w.split('').map(c => '<span class="tt-char">' + c + '</span>').join('') + '</div>').join('');
  }

  render() {
    this.container.innerHTML = `
      <div class="mp-game">
        <div class="mp-game-header">
          <div class="mp-timer" id="mp-timer">${this.timeLeft}</div>
          <button class="btn btn-ghost" id="mp-quit-btn">Quit</button>
        </div>
        
        <!-- OPONNENT PANEL (Top, smaller) -->
        <div class="mp-panel opponent-panel">
          <div class="mp-panel-label">Opponent</div>
          <div class="tt-words-wrapper" style="height: 50px;">
            <div class="tt-words" id="mp-opp-words">${this.wordsHtml}</div>
          </div>
        </div>

        <!-- MY PANEL (Bottom, larger) -->
        <div class="mp-panel my-panel">
          <div class="mp-panel-label">You</div>
          <div class="tt-words-wrapper" id="mp-my-wrapper" style="height: 120px;">
            <div class="tt-words" id="mp-my-words">${this.wordsHtml}</div>
          </div>
          <input type="text" id="mp-hidden-input" class="tt-hidden-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
        </div>
        
        <!-- Results Overlay -->
        <div class="mp-results-overlay" id="mp-results-overlay" style="display: none;">
          <h2>Match Finished!</h2>
          <div id="mp-results-content">Waiting for opponent...</div>
          <button class="btn btn-primary" id="mp-back-lobby-btn" style="margin-top: 1rem;">Back to Lobby</button>
        </div>
      </div>
    `;

    document.getElementById('mp-quit-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    document.getElementById('mp-back-lobby-btn').addEventListener('click', () => {
      this.destroy();
      if (this.onExit) this.onExit();
    });

    // Setup input
    const input = document.getElementById('mp-hidden-input');
    this.container.addEventListener('click', () => input.focus());
    
    input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    input.addEventListener('input', (e) => this.handleInput(e));

    // Initialize UI
    this.updateMyWordClasses();
    this.updateOppWordClasses();
    input.focus();

    // Start Engine
    this.startTimers();
    this.startSync();
  }

  startTimers() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      const el = document.getElementById('mp-timer');
      if (el) el.textContent = this.timeLeft;
      
      if (this.timeLeft <= 0) {
        this.finishGame();
      }
    }, 1000);
  }

  startSync() {
    // Write sync
    this.syncTimer = setInterval(() => {
      if (this.isFinished) return;
      const progress = (this.myIndex / this.words.length) * 100;
      updateMatchState(this.matchId, this.isHost, {
        wordIndex: this.myIndex,
        progress: progress,
        wpm: this.calculateWPM()
      });
    }, 500); // Sync every 500ms to save Firestore quota

    // Read sync
    this.unsubscribeMatch = listenToMatch(this.matchId, (match) => {
      if (!match) return;
      const oppState = this.isHost ? match.guestState : match.hostState;
      if (oppState && oppState.wordIndex !== undefined) {
        this.oppIndex = oppState.wordIndex;
        this.updateOppWordClasses();
      }
      
      // Check if both finished
      if (match.status === 'finished') {
         this.showResults(match);
      }
    });
  }

  calculateWPM() {
    const elapsed = this.settings.timeLimit - this.timeLeft;
    if (elapsed <= 0) return 0;
    return Math.round((this.myCorrectChars / 5) / (elapsed / 60));
  }

  finishGame() {
    this.isFinished = true;
    clearInterval(this.timer);
    clearInterval(this.syncTimer);
    
    const wpm = this.calculateWPM();
    const acc = this.myTotalChars > 0 ? Math.round((this.myCorrectChars / this.myTotalChars) * 100) : 0;
    
    document.getElementById('mp-hidden-input').disabled = true;
    
    // Sync final stats
    finishMatch(this.matchId, this.isHost, { wpm, accuracy: acc });
    
    const overlay = document.getElementById('mp-results-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  showResults(match) {
    const overlay = document.getElementById('mp-results-overlay');
    const content = document.getElementById('mp-results-content');
    if (!overlay || !content) return;
    
    const myState = this.isHost ? match.hostState : match.guestState;
    const oppState = this.isHost ? match.guestState : match.hostState;
    
    const myWpm = myState.finalWpm || myState.wpm || 0;
    const oppWpm = oppState.finalWpm || oppState.wpm || 0;
    
    let winner = 'Tie!';
    if (myWpm > oppWpm) winner = 'You Won! 🏆';
    if (oppWpm > myWpm) winner = 'Opponent Won! 😢';
    
    content.innerHTML = `
      <h3 style="color: var(--accent-cyan); margin: 1rem 0;">${winner}</h3>
      <div style="display: flex; gap: 2rem; justify-content: center; margin-top: 1rem;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary);">YOU</div>
          <div style="font-size: 2rem; font-family: var(--font-mono);">${myWpm} WPM</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary);">OPPONENT</div>
          <div style="font-size: 2rem; font-family: var(--font-mono);">${oppWpm} WPM</div>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';
  }

  handleKeyDown(e) {
    if (this.isFinished) { e.preventDefault(); return; }
    const currentWord = this.words[this.myIndex];
    
    if (e.key === 'Backspace') {
      soundEngine.playKeySound(false);
      if (this.myCharIndex > 0) {
        this.myCharIndex--;
        this.updateMyWordClasses();
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      if (this.myCharIndex > 0) {
        soundEngine.playKeySound(true);
        if (this.myCharIndex === currentWord.length) {
          // Word typed correctly
          this.myCorrectChars += currentWord.length + 1; // +1 for space
        }
        this.myIndex++;
        this.myCharIndex = 0;
        this.updateMyWordClasses();
        this.scrollToCurrentWord();
      }
    }
  }

  handleInput(e) {
    if (this.isFinished) return;
    const val = e.target.value;
    e.target.value = '';
    
    if (val && val.trim().length > 0) {
      soundEngine.playKeySound(false);
      const char = val[val.length - 1];
      const currentWord = this.words[this.myIndex];
      
      if (this.myCharIndex < currentWord.length) {
        this.myTotalChars++;
        this.myCharIndex++;
        this.updateMyWordClasses();
      }
    }
  }

  updateMyWordClasses() {
    const wordsEl = document.getElementById('mp-my-words');
    if (!wordsEl) return;
    const wordEls = wordsEl.children;
    
    for (let i = 0; i <= this.myIndex; i++) {
      const wEl = wordEls[i];
      if (!wEl) continue;
      
      if (i < this.myIndex) {
        wEl.className = 'tt-word correct';
        Array.from(wEl.children).forEach(c => c.className = 'tt-char correct');
      } else if (i === this.myIndex) {
        wEl.className = 'tt-word current';
        Array.from(wEl.children).forEach((c, idx) => {
          if (idx < this.myCharIndex) c.className = 'tt-char correct';
          else if (idx === this.myCharIndex) c.className = 'tt-char current';
          else c.className = 'tt-char';
        });
      }
    }
  }

  updateOppWordClasses() {
    const wordsEl = document.getElementById('mp-opp-words');
    if (!wordsEl) return;
    const wordEls = wordsEl.children;
    
    for (let i = 0; i <= this.oppIndex; i++) {
      const wEl = wordEls[i];
      if (!wEl) continue;
      
      if (i < this.oppIndex) {
        wEl.className = 'tt-word correct';
        Array.from(wEl.children).forEach(c => c.className = 'tt-char correct');
      } else if (i === this.oppIndex) {
        wEl.className = 'tt-word current';
      }
    }
    
    // Scroll opponent wrapper
    const currentWordEl = wordEls[this.oppIndex];
    if (currentWordEl) {
      const offset = currentWordEl.offsetTop;
      if (offset > 25) {
        wordsEl.style.transform = 'translateY(-' + (offset - 25) + 'px)';
      }
    }
  }

  scrollToCurrentWord() {
    const wordsEl = document.getElementById('mp-my-words');
    const currentWordEl = wordsEl?.querySelector('.tt-word.current');
    if (!currentWordEl || !wordsEl) return;

    const offset = currentWordEl.offsetTop;
    if (offset > 45) {
      wordsEl.style.transform = 'translateY(-' + (offset - 45) + 'px)';
    } else {
      wordsEl.style.transform = 'translateY(0px)';
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.unsubscribeMatch) this.unsubscribeMatch();
    this.container.innerHTML = '';
  }
}
