/* =========================================================
   全勤结算（纯函数，无 DOM 依赖，可测试）
   规则：一周（周一至周日）内打卡 ≥5 天 → 额外 +3 星光
   日期为 YYYY-MM-DD 字符串，字典序即时间序
   ========================================================= */

import { addDays } from './dates.js';

export const WEEK_BONUS = 3;
export const MIN_DAYS = 5;

/** 统计 [weekStart, weekEnd] 区间内的打卡天数（同一天多条只计 1 天） */
export function weekDays(logs, weekStart, weekEnd) {
  const days = new Set();
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.date >= weekStart && l.date <= weekEnd) days.add(l.date);
  }
  return days.size;
}

/** 是否达成全勤（≥5 天） */
export function isFullWeek(logs, weekStart, weekEnd) {
  return weekDays(logs, weekStart, weekEnd) >= MIN_DAYS;
}

/** 结算一周：满勤返回 +WEEK_BONUS，否则不变（纯函数） */
export function settleWeek(logs, stars, weekStart, weekEnd) {
  return isFullWeek(logs, weekStart, weekEnd) ? stars + WEEK_BONUS : stars;
}

/**
 * 计算待结算的周列表（纯函数）
 * 从 settledWeek 的下一个周开始，直到 prevStart（含）；
 * settledWeek 为 null 时只结算 prevStart（首次使用）
 * 返回各周 weekStart 数组，按时间升序
 */
export function pendingWeeks(settledWeek, prevStart) {
  const list = [];
  let cursor = settledWeek ? addDays(settledWeek, 7) : prevStart;
  while (cursor <= prevStart) {
    list.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return list;
}
