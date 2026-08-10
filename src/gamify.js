// ============================================
// MANIFESTO — Gamification Engine
// XP, Ranks, Levels, and Badges
// ============================================

const STORAGE_KEY_XP = 'manifesto_user_xp';

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
    return parseInt(localStorage.getItem(STORAGE_KEY_XP) || '0', 10);
  } catch { return 0; }
}

export function addXP(amount) {
  const current = getXP();
  const next = current + amount;
  localStorage.setItem(STORAGE_KEY_XP, next.toString());

  // Check level up
  const oldRank = getRankForXP(current);
  const newRank = getRankForXP(next);

  return {
    xp: next,
    gained: amount,
    leveledUp: newRank.level > oldRank.level,
    newRank,
  };
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
