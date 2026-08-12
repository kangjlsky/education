/* =========================================================
   宠物等级逻辑（纯函数，无 DOM 依赖，可测试）
   规则：每累计 10 星光升 1 级（向下取整）
   ========================================================= */

export const LEVEL_EVERY = 10;

/** 等级 = floor(累计星光 / 10) */
export function petLevel(stars) {
  const n = Number(stars);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n / LEVEL_EVERY);
}

/** 距下一级还差多少星光（0 星光时差 10） */
export function nextLevelIn(stars) {
  const n = Number(stars);
  const base = Number.isFinite(n) && n > 0 ? n : 0;
  return LEVEL_EVERY - (base % LEVEL_EVERY);
}

/** 当前级进度（0-1） */
export function levelProgress(stars) {
  const n = Number(stars);
  const base = Number.isFinite(n) && n > 0 ? n : 0;
  return (base % LEVEL_EVERY) / LEVEL_EVERY;
}

/** 星光从 before 到 after 期间跨过的等级数 */
export function newLevels(before, after) {
  return Math.max(0, petLevel(after) - petLevel(before));
}
