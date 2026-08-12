// ============================================
// MANIFESTO — Data Store
// Manages all data with Firestore + localStorage
// ============================================

import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from './firebase.js';

const STORAGE_KEY = 'manifesto_data';
const SCRATCHPAD_KEY = 'manifesto_scratchpad';
const ACTIVITY_KEY = 'manifesto_activity_log';
const FOCUS_KEY = 'manifesto_focus_stats';
const XP_KEY = 'manifesto_user_xp';
const GEMINI_KEY = 'manifesto_gemini_key';

// Current user ID (set on login)
let currentUID = null;

export function setCurrentUID(uid) {
  currentUID = uid;
}

export function getCurrentUID() {
  return currentUID;
}



function getKey(base) {
  return currentUID ? `${base}_${currentUID}` : base;
}

export function getApiKey() {
  try {
    return localStorage.getItem(getKey(GEMINI_KEY)) || '';
  } catch { return ''; }
}

export function setApiKey(key) {
  try {
    localStorage.setItem(getKey(GEMINI_KEY), key.trim());
  } catch (e) {
    console.error('Failed to save API key', e);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getDefaultData() {
  return {
    weeks: [],
    currentWeekIndex: 0,
    settings: {
      filter: 'all',
    },
  };
}

// ---- Firestore Helpers ----
function getUserDocRef() {
  if (!currentUID) return null;
  return doc(db, 'users', currentUID);
}

async function saveToFirestore(field, value) {
  const ref = getUserDocRef();
  if (!ref) return;
  try {
    await setDoc(ref, { [field]: value }, { merge: true });
  } catch (e) {
    console.warn('Firestore save failed (offline?):', e.message);
  }
}

async function loadFromFirestore() {
  const ref = getUserDocRef();
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.warn('Firestore load failed (offline?):', e.message);
  }
  return null;
}

// ---- Main Data ----
export function loadData() {
  try {
    const raw = localStorage.getItem(getKey(STORAGE_KEY));
    if (raw) {
      const data = JSON.parse(raw);
      if (!data.settings) data.settings = { filter: 'all' };
      return data;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return getDefaultData();
}

export function saveData(data) {
  try {
    localStorage.setItem(getKey(STORAGE_KEY), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
  // Async cloud sync
  saveToFirestore('data', data);
}

/**
 * Load all user data from Firestore into localStorage
 */
export async function loadAllFromCloud() {
  const cloud = await loadFromFirestore();
  if (!cloud) return null;

  if (cloud.data) {
    localStorage.setItem(getKey(STORAGE_KEY), JSON.stringify(cloud.data));
  }
  if (cloud.scratchpad !== undefined) {
    localStorage.setItem(getKey(SCRATCHPAD_KEY), cloud.scratchpad);
  }
  if (cloud.activityLog) {
    localStorage.setItem(getKey(ACTIVITY_KEY), JSON.stringify(cloud.activityLog));
  }
  if (cloud.focusStats) {
    localStorage.setItem(getKey(FOCUS_KEY), JSON.stringify(cloud.focusStats));
  }
  if (cloud.xp !== undefined) {
    localStorage.setItem(getKey(XP_KEY), String(cloud.xp));
  }

  return cloud.data || getDefaultData();
}

/**
 * Push all current localStorage data to Firestore (used on first login or migration)
 */
export async function pushAllToCloud() {
  const ref = getUserDocRef();
  if (!ref) return;
  try {
    await setDoc(ref, {
      data: loadData(),
      scratchpad: loadScratchpad(),
      activityLog: getActivityLogRaw(),
      focusStats: getFocusStats(),
      xp: parseInt(localStorage.getItem(getKey(XP_KEY)) || '0', 10),
    }, { merge: true });
  } catch (e) {
    console.warn('Push to cloud failed:', e.message);
  }
}

// ---- Week Operations ----
export function addWeek(data) {
  const weekNumber = data.weeks.length + 1;
  const newWeek = {
    id: generateId(),
    number: weekNumber,
    label: `Week ${weekNumber}`,
    createdAt: new Date().toISOString(),
    goals: [],
  };
  data.weeks.push(newWeek);
  data.currentWeekIndex = data.weeks.length - 1;
  saveData(data);
  return newWeek;
}

export function deleteWeek(data, weekId) {
  const idx = data.weeks.findIndex((w) => w.id === weekId);
  if (idx === -1) return;
  data.weeks.splice(idx, 1);
  data.weeks.forEach((w, i) => {
    w.number = i + 1;
    if (!w.label || w.label.startsWith('Week ')) {
      w.label = `Week ${i + 1}`;
    }
  });
  if (data.currentWeekIndex >= data.weeks.length) {
    data.currentWeekIndex = Math.max(0, data.weeks.length - 1);
  }
  saveData(data);
}

export function renameWeek(data, weekId, newLabel) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (week) {
    week.label = newLabel.trim() || `Week ${week.number}`;
    saveData(data);
  }
}

export function getCurrentWeek(data) {
  if (data.weeks.length === 0) return null;
  return data.weeks[data.currentWeekIndex] || data.weeks[0];
}

// ---- Goal Operations ----
export function addGoal(data, weekId, goalData) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return null;
  const goal = {
    id: generateId(),
    title: goalData.title,
    description: goalData.description || '',
    priority: goalData.priority || 'medium',
    category: goalData.category || 'other',
    status: 'todo',
    createdAt: new Date().toISOString(),
  };
  week.goals.push(goal);
  saveData(data);
  return goal;
}

export function updateGoal(data, weekId, goalId, updates) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  const goal = week.goals.find((g) => g.id === goalId);
  if (!goal) return;
  Object.assign(goal, updates);
  saveData(data);
  return goal;
}

export function deleteGoal(data, weekId, goalId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  week.goals = week.goals.filter((g) => g.id !== goalId);
  saveData(data);
}

export function cycleGoalStatus(data, weekId, goalId) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return null;
  const goal = week.goals.find((g) => g.id === goalId);
  if (!goal) return null;

  const statusCycle = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
  goal.status = statusCycle[goal.status] || 'todo';
  saveData(data);
  return goal.status;
}

export function reorderGoals(data, weekId, fromIndex, toIndex) {
  const week = data.weeks.find((w) => w.id === weekId);
  if (!week) return;
  const [moved] = week.goals.splice(fromIndex, 1);
  week.goals.splice(toIndex, 0, moved);
  saveData(data);
}

// ---- Stats ----
export function getStats(data) {
  let totalGoals = 0;
  let doneGoals = 0;
  let inProgressGoals = 0;
  let todoGoals = 0;

  data.weeks.forEach((week) => {
    week.goals.forEach((goal) => {
      totalGoals++;
      if (goal.status === 'done') doneGoals++;
      else if (goal.status === 'in-progress') inProgressGoals++;
      else todoGoals++;
    });
  });

  const completionRate = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  return {
    totalGoals,
    doneGoals,
    inProgressGoals,
    todoGoals,
    completionRate,
    totalWeeks: data.weeks.length,
  };
}

export function getWeekStats(week) {
  if (!week || !week.goals.length) return { total: 0, done: 0, progress: 0 };
  const done = week.goals.filter((g) => g.status === 'done').length;
  return {
    total: week.goals.length,
    done,
    progress: Math.round((done / week.goals.length) * 100),
  };
}

export function searchGoals(data, query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results = [];
  data.weeks.forEach((week) => {
    week.goals.forEach((goal) => {
      if (
        goal.title.toLowerCase().includes(q) ||
        goal.description.toLowerCase().includes(q) ||
        goal.category.toLowerCase().includes(q)
      ) {
        results.push({ ...goal, weekId: week.id, weekLabel: week.label });
      }
    });
  });
  return results;
}

// ---- Category Stats ----
export function getCategoryStats(data) {
  const cats = {};
  let total = 0;
  data.weeks.forEach((week) => {
    week.goals.forEach((goal) => {
      total++;
      cats[goal.category] = (cats[goal.category] || 0) + 1;
    });
  });
  const result = {};
  for (const [key, count] of Object.entries(cats)) {
    result[key] = { count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
  }
  return result;
}

// ---- Scratchpad Persistence ----
export function loadScratchpad() {
  try {
    return localStorage.getItem(getKey(SCRATCHPAD_KEY)) || '';
  } catch { return ''; }
}

export function saveScratchpad(text) {
  try {
    localStorage.setItem(getKey(SCRATCHPAD_KEY), text);
  } catch (e) {
    console.error('Failed to save scratchpad:', e);
  }
  saveToFirestore('scratchpad', text);
}

// ---- Activity & Streak Tracking ----
function getActivityLogRaw() {
  try {
    return JSON.parse(localStorage.getItem(getKey(ACTIVITY_KEY)) || '{}');
  } catch { return {}; }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function recordGoalCompletion() {
  const log = getActivityLogRaw();
  const key = todayKey();
  log[key] = (log[key] || 0) + 1;
  localStorage.setItem(getKey(ACTIVITY_KEY), JSON.stringify(log));
  saveToFirestore('activityLog', log);
}

export function getStreakDays() {
  const log = getActivityLogRaw();
  let streak = 0;
  const d = new Date();
  const todayStr = todayKey();
  if (!log[todayStr]) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (log[key] && log[key] > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
    if (streak > 365) break;
  }
  return streak;
}

export function getLast7DaysActivity() {
  const log = getActivityLogRaw();
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      label: dayNames[d.getDay()],
      count: log[key] || 0,
    });
  }
  return days;
}

// ---- Focus Timer Stats ----
export function getFocusStats() {
  try {
    return JSON.parse(localStorage.getItem(getKey(FOCUS_KEY)) || '{"sessions":0,"totalMinutes":0}');
  } catch { return { sessions: 0, totalMinutes: 0 }; }
}

export function recordFocusSession(minutes) {
  const stats = getFocusStats();
  stats.sessions++;
  stats.totalMinutes += minutes;
  localStorage.setItem(getKey(FOCUS_KEY), JSON.stringify(stats));
  saveToFirestore('focusStats', stats);
  return stats;
}

// ---- Data Export & Import ----
export function exportDataAsJSON() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: loadData(),
    scratchpad: loadScratchpad(),
    activity: getActivityLogRaw(),
    focus: getFocusStats(),
    xp: localStorage.getItem(getKey(XP_KEY)) || '0',
  };
  return JSON.stringify(payload, null, 2);
}

export function importDataFromJSON(jsonString) {
  try {
    const payload = JSON.parse(jsonString);
    if (!payload.data || !payload.data.weeks) {
      throw new Error('Invalid backup format');
    }
    saveData(payload.data);
    if (payload.scratchpad !== undefined) saveScratchpad(payload.scratchpad);
    if (payload.activity) {
      localStorage.setItem(getKey(ACTIVITY_KEY), JSON.stringify(payload.activity));
      saveToFirestore('activityLog', payload.activity);
    }
    if (payload.focus) {
      localStorage.setItem(getKey(FOCUS_KEY), JSON.stringify(payload.focus));
      saveToFirestore('focusStats', payload.focus);
    }
    if (payload.xp) {
      localStorage.setItem(getKey(XP_KEY), payload.xp);
      saveToFirestore('xp', parseInt(payload.xp, 10));
    }
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

// ---- Leaderboard ----
export async function saveTypingStats(wpm, xp) {
  const ref = getUserDocRef();
  if (!ref || !auth.currentUser) return;
  const email = auth.currentUser.email || '';
  const displayName = email.split('@')[0] || 'Anonymous';

  try {
    const snap = await getDoc(ref);
    let currentBest = 0;
    if (snap.exists() && snap.data().bestWpm) {
      currentBest = snap.data().bestWpm;
    }

    const updates = {
      displayName,
      lastActive: new Date().toISOString()
    };
    
    if (wpm !== undefined) {
      updates.bestWpm = Math.max(currentBest, wpm);
    }
    if (xp !== undefined) updates.xp = xp;

    await setDoc(ref, updates, { merge: true });
  } catch (e) {
    console.warn('Failed to save typing stats to cloud:', e);
  }
}

export async function getTopWPM(limitCount = 10) {
  try {
    const q = query(collection(db, 'users'), orderBy('bestWpm', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.bestWpm > 0);
  } catch (e) {
    console.error('Failed to get top WPM:', e);
    return [];
  }
}

export async function getTopXP(limitCount = 10) {
  try {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.xp > 0);
  } catch (e) {
    console.error('Failed to get top XP:', e);
    return [];
  }
}

// ============================================
// MULTIPLAYER LOGIC
// ============================================

export async function createMatch(settings) {
  if (!auth.currentUser) throw new Error('Not logged in');
  const email = auth.currentUser.email || '';
  const displayName = email.split('@')[0] || 'Anonymous';
  
  const matchData = {
    status: 'waiting', // waiting, starting, playing, finished
    hostUid: currentUID,
    hostName: displayName,
    hostState: {
      wpm: 0,
      progress: 0, // percentage
      wordIndex: 0
    },
    guestUid: null,
    guestName: null,
    guestState: {
      wpm: 0,
      progress: 0,
      wordIndex: 0
    },
    settings: settings || { timeLimit: 30, difficulty: 'medium', seed: Math.floor(Math.random() * 1000000) },
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'matches'), matchData);
  return docRef.id;
}

export async function joinMatch(matchId) {
  if (!auth.currentUser) throw new Error('Not logged in');
  const email = auth.currentUser.email || '';
  const displayName = email.split('@')[0] || 'Anonymous';
  
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, {
    guestUid: currentUID,
    guestName: displayName,
    status: 'starting' // Automatically triggers countdown for both
  });
}

export async function startMatchCountdown(matchId) {
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, {
    status: 'playing'
  });
}

export async function updateMatchState(matchId, isHost, stateUpdates) {
  if (!matchId) return;
  const ref = doc(db, 'matches', matchId);
  const fieldPrefix = isHost ? 'hostState' : 'guestState';
  
  // Transform stateUpdates into dot-notation for nested update
  const updates = {};
  for (const [key, value] of Object.entries(stateUpdates)) {
    updates[`${fieldPrefix}.${key}`] = value;
  }
  
  await updateDoc(ref, updates);
}

export async function finishMatch(matchId, isHost, finalStats) {
  if (!matchId) return;
  const ref = doc(db, 'matches', matchId);
  const fieldPrefix = isHost ? 'hostState' : 'guestState';
  
  const updates = {
    [`${fieldPrefix}.finalWpm`]: finalStats.wpm,
    [`${fieldPrefix}.finalAcc`]: finalStats.accuracy,
    status: 'finished'
  };
  
  await updateDoc(ref, updates);
}

export async function cancelMatch(matchId) {
  if (!matchId) return;
  const ref = doc(db, 'matches', matchId);
  await deleteDoc(ref);
}

// Listeners
export function listenToOpenMatches(callback) {
  const q = query(
    collection(db, 'matches'),
    where('status', '==', 'waiting'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(matches);
  });
}

export function listenToMatch(matchId, callback) {
  if (!matchId) return () => {};
  const ref = doc(db, 'matches', matchId);
  return onSnapshot(ref, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null); // Match deleted/cancelled
    }
  });
}

// ============================================
// TYPE TO PAY — Earnings System
// ============================================

const EARNINGS_LOCAL_KEY = 'manifesto_earnings';

function getEarningsKey() {
  return currentUID ? `${EARNINGS_LOCAL_KEY}_${currentUID}` : EARNINGS_LOCAL_KEY;
}

export function loadEarningsLocal() {
  try {
    const raw = localStorage.getItem(getEarningsKey());
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { totalWords: 0, totalEarnings: 0 };
}

export function saveEarningsLocal(totalWords, totalEarnings) {
  try {
    localStorage.setItem(getEarningsKey(), JSON.stringify({ totalWords, totalEarnings }));
  } catch (e) { /* ignore */ }
}

export async function saveEarningsToCloud(totalWords, totalEarnings) {
  const ref = getUserDocRef();
  if (!ref) return;
  try {
    await setDoc(ref, {
      earnings: {
        totalWords,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        lastUpdated: new Date().toISOString()
      }
    }, { merge: true });
  } catch (e) {
    console.warn('Failed to save earnings to cloud:', e);
  }
}

export async function loadEarningsFromCloud() {
  const ref = getUserDocRef();
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().earnings) {
      return snap.data().earnings;
    }
  } catch (e) {
    console.warn('Failed to load earnings from cloud:', e);
  }
  return null;
}

export async function requestCashout(amount, upiId) {
  if (!auth.currentUser) throw new Error('Not logged in');
  const email = auth.currentUser.email || '';
  const displayName = email.split('@')[0] || 'Anonymous';

  const cashoutData = {
    uid: currentUID,
    displayName,
    email,
    amount: Math.round(amount * 100) / 100,
    upiId,
    status: 'pending', // pending -> processing -> approved -> done
    requestedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'cashouts'), cashoutData);
  return docRef.id;
}

export async function getUserCashouts() {
  if (!currentUID) return [];
  try {
    const q = query(
      collection(db, 'cashouts'),
      where('uid', '==', currentUID),
      limit(50)
    );
    const snap = await getDocs(q);
    const cashouts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory to avoid requiring a composite index in Firestore
    cashouts.sort((a, b) => {
      const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : 0;
      const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    return cashouts;
  } catch (e) {
    console.warn('Failed to load cashouts:', e);
    return [];
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export async function getAllUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Failed to get all users:', e);
    return [];
  }
}

export async function getAllCashouts() {
  try {
    const q = query(collection(db, 'cashouts'), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Failed to get all cashouts:', e);
    return [];
  }
}

export async function updateCashoutStatus(docId, status) {
  try {
    const docRef = doc(db, 'cashouts', docId);
    const updateData = { status };
    if (status === 'done') {
      updateData.doneAt = serverTimestamp();
    }
    await updateDoc(docRef, updateData);
    return true;
  } catch (e) {
    console.error('Failed to update cashout status:', e);
    return false;
  }
}
