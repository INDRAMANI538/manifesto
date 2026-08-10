// ============================================
// MANIFESTO — Data Store
// Manages all data with localStorage persistence
// ============================================

const STORAGE_KEY = 'manifesto_data';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getDefaultData() {
  return {
    weeks: [],
    currentWeekIndex: 0,
    settings: {
      filter: 'all', // all | todo | in-progress | done
    },
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Ensure settings exist
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

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
  // Re-number weeks
  data.weeks.forEach((w, i) => {
    w.number = i + 1;
    if (!w.label || w.label.startsWith('Week ')) {
      w.label = `Week ${i + 1}`;
    }
  });
  // Fix current index
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
