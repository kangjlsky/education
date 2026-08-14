/* =========================================================
   古文解锁（纯函数，无 DOM 依赖，可测试）
   规则：每学满 10 首古诗解锁 1 篇古文
   ========================================================= */

export const CLASSICS_PER_TEN = 10;

/**
 * 已解锁的古文索引（0-based）
 * @param {number} learnedPoemCount 已学古诗数
 * @param {number} classicsCount 古文总篇数
 */
export function unlockedClassics(learnedPoemCount, classicsCount) {
  const n = Number(learnedPoemCount) || 0;
  const unlocked = [];
  for (let i = 1; i <= classicsCount; i += 1) {
    if (n >= i * CLASSICS_PER_TEN) unlocked.push(i - 1);
  }
  return unlocked;
}

/** 距下一篇古文还需学习几首古诗（无上限概念，返回正整数） */
export function nextClassicIn(learnedPoemCount) {
  const n = Number(learnedPoemCount) || 0;
  return CLASSICS_PER_TEN - (n % CLASSICS_PER_TEN);
}
