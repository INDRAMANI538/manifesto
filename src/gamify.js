// ============================================
// MANIFESTO — Gamification Engine
// XP, Ranks, Levels, and Badges
// ============================================

const STORAGE_KEY_XP = 'manifesto_user_xp';
import { getCurrentUID, saveTypingStats } from './store.js';

function getKey() {
  const uid = getCurrentUID();
  return uid ? `${STORAGE_KEY_XP}_${uid}` : STORAGE_KEY_XP;
}

const RANKS = [
  { level: 1, name: 'Novice Typist', xpNeeded: 0, icon: '🌱' },
  { level: 2, name: 'Home Row Apprentice', xpNeeded: 100, icon: '🏠' },
  { level: 3, name: 'Key Cadet', xpNeeded: 300, icon: '⚡' },
  { level: 4, name: 'Keyboard Warrior', xpNeeded: 600, icon: '⚔️' },
  { level: 5, name: 'Speed Demon', xpNeeded: 1000, icon: '🔥' },
  { level: 6, name: 'Cyber Ninja', xpNeeded: 1800, icon: '🥷' },
  { level: 7, name: 'Typing Master', xpNeeded: 3000, icon: '👑' },
  { level: 8, name: 'Manifesto Grandmaster', xpNeeded: 5000, icon: '🌌' },
];

export function getXP() {
  try {
    return parseInt(localStorage.getItem(getKey()) || '0', 10);
  } catch { return 0; }
}

let xpSyncTimeout = null;

export function addXP(amount) {
  const current = getXP();
  const next = current + amount;
  localStorage.setItem(getKey(), next.toString());

  // Check level up
  const oldRank = getRankForXP(current);
  const newRank = getRankForXP(next);

  const result = {
    xp: next,
    gained: amount,
    leveledUp: newRank.level > oldRank.level,
    newRank,
  };

  // Dispatch global event for live UI updates
  window.dispatchEvent(new CustomEvent('manifesto-xp-gained', { detail: result }));

  // Sync to cloud (debounced by 3 seconds)
  clearTimeout(xpSyncTimeout);
  xpSyncTimeout = setTimeout(() => {
    saveTypingStats(undefined, next);
  }, 3000);

  return result;
}

export function getRankForXP(xp) {
  let rank = RANKS[0];
  for (let r of RANKS) {
    if (xp >= r.xpNeeded) rank = r;
  }
  return rank;
}

export function getNextRank(currentLevel) {
  return RANKS.find((r) => r.level === currentLevel + 1) || null;
}
