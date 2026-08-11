/* =========================================================
   日期工具（纯函数，本地时区，字符串统一 YYYY-MM-DD）
   用于周计划、复习调度与全勤结算
   ========================================================= */

/** Date → 本地日期字符串 YYYY-MM-DD */
export function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 日期字符串加减天数（自动跨月跨年） */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return toDateStr(dt);
}

/** 返回日期所在周的周一（周一为一周开始） */
export function mondayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 周一=0 … 周日=6
  return addDays(dateStr, -dow);
}
