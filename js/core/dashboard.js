/* =========================================================
   看板聚合与每日报告（纯函数，无 DOM 依赖，可测试）
   ========================================================= */

import { addDays } from './dates.js';
import { weekDays } from './attendance.js';

/** 某月内打卡日期集合（YYYY-MM-DD，同天多条去重） */
export function monthDays(logs, year, month) {
  const days = new Set();
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && typeof l.date === 'string' && l.date.startsWith(prefix)) days.add(l.date);
  }
  return days;
}

/** 月内全勤周（周一起点，打卡满 5 天）的周起始日列表 */
export function fullWeeksInMonth(logs, year, month) {
  const days = monthDays(logs, year, month);
  const dayList = [...days].map((d) => ({ date: d }));
  const full = [];
  // 该月第一个周一起点（月初所在周的周一，可能在上月）
  const first = new Date(year, month - 1, 1);
  const dow = (first.getDay() + 6) % 7;
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const anchor = new Date(year, month - 1, 1 - dow);
  let w = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`;
  // 月初跨月周（起点在上月、当月内 ≥5 天）：满勤也标记（锚点在月内时交给主循环，避免重复）
  if (!w.startsWith(prefix)) {
    const anchorEnd = addDays(w, 6);
    const anchorInMonth = [...days].filter((d) => d.startsWith(prefix) && d >= w && d <= anchorEnd).length;
    if (anchorInMonth >= 5 && weekDays(dayList, w, anchorEnd) >= 5) {
      full.push(w);
    }
  }
  // 推进到第一个落在该月内的周一（月初周一可能在上月）
  while (!w.startsWith(prefix)) {
    w = addDays(w, 7);
  }
  const lastDay = new Date(year, month, 0).getDate();
  // 仅扫描"周起点落在该月内"的周
  while (w.startsWith(prefix) && Number(w.slice(8)) <= lastDay) {
    if (weekDays(dayList, w, addDays(w, 6)) >= 5) full.push(w);
    w = addDays(w, 7);
  }
  return full;
}

/** 近 7 天每日打卡次数（含今天，无打卡日为 0） */
export function last7Days(logs, today) {
  const result = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const count = (Array.isArray(logs) ? logs : []).filter((l) => l && l.date === date).length;
    result.push({ date, count });
  }
  return result;
}

/** 科目进度：已学去重数 / 总量 */
export function subjectProgress(logs, subject, total) {
  const seen = new Set();
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.subject === subject && l.item) seen.add(l.item);
  }
  return { done: seen.size, total };
}

/**
 * 每日学习报告（纯函数）
 * @returns {{count, subjects, starsEarned, medalsEarned, summary, tomorrow}}
 */
export function buildDailyReport(logs, stars, medals, today) {
  const list = (Array.isArray(logs) ? logs : []).filter((l) => l && l.date === today);
  const subjects = [...new Set(list.map((l) => l.subject))];
  const starsEarned = list.length; // 每项打卡 +1 星光
  const history = Array.isArray(medals?.history) ? medals.history : [];
  const medalsEarned = history
    .filter((h) => h && h.date === today && h.type === 'earn')
    .reduce((s, h) => s + (Number(h.n) || 0), 0);

  let summary;
  if (list.length === 0) {
    summary = '今天还没有学习，快来打卡吧！';
  } else if (list.length >= 5) {
    summary = '今天完成了很多任务，你是最棒的！';
  } else {
    summary = `今天完成了 ${list.length} 项打卡，继续加油！`;
  }

  return {
    count: list.length,
    subjects,
    starsEarned,
    medalsEarned,
    summary,
    tomorrow: addDays(today, 1),
  };
}
