// ============================================================
// EBS Unified Platform — Configuration & Utilities
// ============================================================

// ── Tracker Period & Working Hours ────────────────────────────
export const TRACKER_START_DATE  = '2026-03-03';
export const RAMADAN_2026_START  = '2026-02-18';
export const RAMADAN_2026_END    = '2026-03-20';
export const RAMADAN_DAILY_HOURS = 6;
export const NORMAL_DAILY_HOURS  = 8;

// ── Kuwait Public Holidays 2026 ──────────────────────────────
export const KUWAIT_HOLIDAYS_2026 = [
  '2026-03-22','2026-03-23',
  '2026-06-07','2026-06-08','2026-06-09',
  '2026-06-28','2026-09-06',
];

// ── RPG Levels ───────────────────────────────────────────────
export const LEVELS = [
  { level: 1, name: 'Novice',     minHours: 0,   color: '#94a3b8', icon: '⚔️'  },
  { level: 2, name: 'Apprentice', minHours: 26,  color: '#22c55e', icon: '🛡️'  },
  { level: 3, name: 'Journeyman', minHours: 76,  color: '#3b82f6', icon: '⚡'  },
  { level: 4, name: 'Expert',     minHours: 151, color: '#8b5cf6', icon: '🔮'  },
  { level: 5, name: 'Master',     minHours: 301, color: '#f59e0b', icon: '🌟'  },
  { level: 6, name: 'Legend',     minHours: 501, color: '#ef4444', icon: '👑'  },
];

// ── Badges ───────────────────────────────────────────────────
export const BADGES = [
  { id: 'century_knight',   name: 'Century Knight',   desc: 'Log 100+ total hours',              icon: '💯', check: s => s.totalHours >= 100 },
  { id: 'streak_warrior',   name: 'Streak Warrior',   desc: 'Log tasks 7 consecutive days',      icon: '🔥', check: s => s.maxStreak >= 7 },
  { id: 'support_guardian', name: 'Support Guardian',  desc: 'Complete 20+ Support tasks',        icon: '🛡️', check: s => s.supportCount >= 20 },
  { id: 'test_mage',        name: 'Test Mage',        desc: 'Complete 20+ Testing tasks',        icon: '🧪', check: s => s.testingCount >= 20 },
  { id: 'project_champion', name: 'Project Champion',  desc: 'Complete 20+ Project tasks',        icon: '🚀', check: s => s.projectCount >= 20 },
  { id: 'powerhouse',       name: 'Powerhouse',       desc: 'Log 8+ hours in a single day',     icon: '⚡', check: s => s.maxDayHours >= 8 },
  { id: 'all_rounder',      name: 'All-Rounder',      desc: 'Use all 3 categories in one week',  icon: '🌟', check: s => s.hasAllRounder },
  { id: 'veteran',          name: 'Veteran',           desc: 'Log tasks on 30+ unique days',     icon: '📅', check: s => s.uniqueDays >= 30 },
  { id: 'prolific',         name: 'Prolific',          desc: 'Complete 50+ tasks total',          icon: '🐦', check: s => s.totalTasks >= 50 },
  { id: 'workhorse',        name: 'Workhorse',         desc: 'Log 250+ total hours',             icon: '🏇', check: s => s.totalHours >= 250 },
];

// ── Project Tracker Constants ────────────────────────────────
export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
export const STATUSES = ['On Track', 'At Risk', 'Delayed', 'Completed', 'On Hold'];
export const PHASES = ['Initiation', 'Planning', 'Execution', 'UAT', 'Go-Live', 'Closed'];
export const IMPACTS = ['High', 'Medium', 'Low'];
export const DEV_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked'];
export const UAT_STATUSES = ['Not Started', 'Pending', 'In Progress', 'Passed', 'Failed'];

export const STATUS_COLORS = {
  'On Track':   { bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-700/50', dot: 'bg-emerald-400', hex: '#10b981' },
  'At Risk':    { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', dot: 'bg-amber-400', hex: '#f59e0b' },
  'Delayed':    { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', dot: 'bg-red-400', hex: '#ef4444' },
  'Completed':  { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700/50', dot: 'bg-blue-400', hex: '#3b82f6' },
  'On Hold':    { bg: 'bg-slate-800/40', text: 'text-slate-400', border: 'border-slate-600/50', dot: 'bg-slate-400', hex: '#94a3b8' },
};
export const STATUS_COLORS_LIGHT = {
  'On Track':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', hex: '#10b981' },
  'At Risk':    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', hex: '#f59e0b' },
  'Delayed':    { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', hex: '#ef4444' },
  'Completed':  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', hex: '#3b82f6' },
  'On Hold':    { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400', hex: '#94a3b8' },
};

export const PRIORITY_COLORS = {
  Critical: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50' },
  High:     { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50' },
  Medium:   { bg: 'bg-sky-900/30', text: 'text-sky-400', border: 'border-sky-700/50' },
  Low:      { bg: 'bg-slate-800/40', text: 'text-slate-400', border: 'border-slate-600/50' },
};
export const PRIORITY_COLORS_LIGHT = {
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  High:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Medium:   { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Low:      { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#94a3b8'];

// ── Auth Helpers ─────────────────────────────────────────────
const SESSION_KEY = 'ebs_session';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getSession() {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Date Helpers ─────────────────────────────────────────────
export function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}

export function getMonthName(date) {
  return new Date(date).toLocaleString('default', { month: 'long' });
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getTodayInfo() {
  const t = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    date: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    month: getMonthName(t),
    week: getWeekNumber(t),
    year: t.getFullYear()
  };
}

export function toDateStr(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isRamadanDay(date) {
  const d = toDateStr(date);
  return d >= RAMADAN_2026_START && d <= RAMADAN_2026_END;
}
export function isKuwaitHoliday(date) { return KUWAIT_HOLIDAYS_2026.includes(toDateStr(date)); }
export function isWeekendDay(date) { const dow = new Date(date).getDay(); return dow === 5 || dow === 6; }
export function getDailyHours(date) { return isRamadanDay(date) ? RAMADAN_DAILY_HOURS : NORMAL_DAILY_HOURS; }

export function getWorkingDaysInfo(warDaysOff = 0, userLeaves = [], warDayRanges = [], startDateOverride = null) {
  const startDateStr = startDateOverride || TRACKER_START_DATE;
  const start = new Date(startDateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const leaveDateSet = new Set();
  (userLeaves || []).forEach(lv => {
    const s = new Date(lv.start_date); s.setHours(0,0,0,0);
    const e = new Date(lv.end_date);   e.setHours(0,0,0,0);
    const c = new Date(s);
    while (c <= e) { leaveDateSet.add(toDateStr(c)); c.setDate(c.getDate() + 1); }
  });

  let rawWorkingDays = 0, rawExpectedHours = 0, ramadanWorkingDays = 0;
  let normalWorkingDays = 0, holidayCount = 0, leaveDays = 0, leaveHours = 0;

  const cur = new Date(start);
  while (cur <= today) {
    const ds = toDateStr(cur);
    if (!isWeekendDay(cur)) {
      if (isKuwaitHoliday(cur)) { holidayCount++; }
      else if (leaveDateSet.has(ds)) { leaveDays++; leaveHours += getDailyHours(cur); }
      else {
        rawWorkingDays++; rawExpectedHours += getDailyHours(cur);
        if (isRamadanDay(cur)) ramadanWorkingDays++; else normalWorkingDays++;
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  const warDateSet = new Set();
  (warDayRanges || []).forEach(wr => {
    const s = new Date(wr.start_date); s.setHours(0,0,0,0);
    const e = new Date(wr.end_date);   e.setHours(0,0,0,0);
    const cc = new Date(s);
    while (cc <= e) {
      if (!isWeekendDay(cc) && !isKuwaitHoliday(cc) && !leaveDateSet.has(toDateStr(cc))) warDateSet.add(toDateStr(cc));
      cc.setDate(cc.getDate() + 1);
    }
  });

  const effectiveWarDays = warDayRanges.length > 0 ? warDateSet.size : Math.min(Math.max(0, parseInt(warDaysOff) || 0), rawWorkingDays);
  let warHours = 0;
  if (warDayRanges.length > 0) { warDateSet.forEach(ds => { warHours += getDailyHours(ds); }); }
  else { warHours = effectiveWarDays * NORMAL_DAILY_HOURS; }

  return {
    workingDays: rawWorkingDays - effectiveWarDays,
    expectedHours: Math.max(0, Math.round((rawExpectedHours - warHours) * 10) / 10),
    rawWorkingDays, rawExpectedHours: Math.round(rawExpectedHours * 10) / 10,
    warDaysOff: effectiveWarDays, warHours: Math.round(warHours * 10) / 10,
    leaveDays, leaveHours: Math.round(leaveHours * 10) / 10,
    ramadanWorkingDays, normalWorkingDays, holidayCount,
    periodLabel: `${formatDate(startDateStr)} → ${formatDate(toDateStr(today))}`,
  };
}

// ── Level Helpers ────────────────────────────────────────────
export function getUserLevel(totalHours) {
  let cur = LEVELS[0];
  for (const lvl of LEVELS) { if (totalHours >= lvl.minHours) cur = lvl; }
  return cur;
}

export function getXPProgress(totalHours) {
  const cur = getUserLevel(totalHours);
  const next = LEVELS.find(l => l.level === cur.level + 1);
  if (!next) return 100;
  return Math.min(Math.round(((totalHours - cur.minHours) / (next.minHours - cur.minHours)) * 100), 100);
}

// ── Stats Calculation ────────────────────────────────────────
export function calculateStats(logs) {
  if (!logs || !logs.length) return {
    totalHours: 0, totalTasks: 0, supportCount: 0, testingCount: 0,
    projectCount: 0, maxStreak: 0, currentStreak: 0, maxDayHours: 0,
    uniqueDays: 0, hasAllRounder: false, accomplishmentRate: 0,
    supportHours: 0, testingHours: 0, projectHours: 0
  };

  const totalHours = logs.reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0);
  const totalTasks = logs.length;
  const supportLogs = logs.filter(l => l.category === 'Support');
  const testingLogs = logs.filter(l => l.category === 'Testing');
  const projectLogs = logs.filter(l => l.category === 'Project');
  const supportHours = supportLogs.reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0);
  const testingHours = testingLogs.reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0);
  const projectHours = projectLogs.reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0);

  const byDate = {};
  logs.forEach(l => {
    const d = l.log_date;
    if (!byDate[d]) byDate[d] = { hours: 0, cats: new Set() };
    byDate[d].hours += parseFloat(l.hours_spent || 0);
    byDate[d].cats.add(l.category);
  });

  const uniqueDays = Object.keys(byDate).length;
  const maxDayHours = Math.max(...Object.values(byDate).map(d => d.hours), 0);

  const sorted = Object.keys(byDate).sort();
  let maxStreak = sorted.length > 0 ? 1 : 0, curStreak = sorted.length > 0 ? 1 : 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    let workingDaysDiff = 0;
    const scan = new Date(prev); scan.setDate(scan.getDate() + 1);
    while (scan <= curr) {
      const dow = scan.getDay();
      if (dow !== 5 && dow !== 6) workingDaysDiff++;
      scan.setDate(scan.getDate() + 1);
    }
    if (workingDaysDiff === 1) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else curStreak = 1;
  }

  const byWeek = {};
  logs.forEach(l => {
    const wk = `${new Date(l.log_date).getFullYear()}-W${getWeekNumber(l.log_date)}`;
    if (!byWeek[wk]) byWeek[wk] = new Set();
    byWeek[wk].add(l.category);
  });
  const hasAllRounder = Object.values(byWeek).some(s => s.size === 3);

  const accomplishmentCount = logs.filter(l => l.accomplishment && l.accomplishment.trim()).length;
  const accomplishmentRate = totalTasks > 0 ? Math.round((accomplishmentCount / totalTasks) * 100) : 0;

  return {
    totalHours: Math.round(totalHours * 10) / 10, totalTasks,
    supportCount: supportLogs.length, testingCount: testingLogs.length, projectCount: projectLogs.length,
    maxStreak, currentStreak: curStreak, maxDayHours, uniqueDays, hasAllRounder,
    accomplishmentRate,
    supportHours: Math.round(supportHours * 10) / 10,
    testingHours: Math.round(testingHours * 10) / 10,
    projectHours: Math.round(projectHours * 10) / 10,
  };
}

export function getEarnedBadges(stats) {
  return BADGES.map(b => ({ ...b, earned: b.check(stats) }));
}

export function aggregateByWeek(logs, nWeeks = 8) {
  const weeks = {};
  for (let i = nWeeks - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i * 7);
    const wk = `W${getWeekNumber(d)}`;
    weeks[wk] = { label: wk, hours: 0, tasks: 0 };
  }
  logs.forEach(l => {
    const wk = `W${getWeekNumber(l.log_date)}`;
    if (weeks[wk]) { weeks[wk].hours += parseFloat(l.hours_spent || 0); weeks[wk].tasks++; }
  });
  return Object.values(weeks);
}

export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r =>
    headers.map(h => {
      const v = String(r[h] ?? '').replace(/"/g, '""');
      return (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v}"` : v;
    }).join(',')
  );
  const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

export function truncate(str, n = 50) {
  return str && str.length > n ? str.slice(0, n) + '…' : (str || '—');
}
