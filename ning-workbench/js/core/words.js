/* =========================================================
   识字领域逻辑（纯函数，无 DOM 依赖，可测试）
   - 今日新字：本周计划生字按工作日分片（默认每日 2 个）
   - 小测出题：4 选 1（正确项 + 3 个干扰项）
   ========================================================= */

export const WORDS_PER_DAY = 2;

/** Fisher-Yates 洗牌（rand 可注入） */
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(rand() * (i + 1)));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 一周内工作日序号：周一到周五为 0-4；周六/周日返回 -1
 */
export function workdayIndex(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (dow === 0 || dow === 6) return -1;
  return dow - 1;
}

/**
 * 今日新字：本周计划生字中"未学"的前 perDay 个（工作日）
 * 工作日之外返回空；已学的跳过（缺席可自然补学）
 * @param {string[]} weekWords 本周计划生字 id
 * @param {string[]} learnedIds 已学字 id
 * @param {string} dateStr 今天 YYYY-MM-DD
 * @param {number} perDay 每日新字数量（默认 2；通常由周计划量推导）
 */
export function pickDailyNewWords(weekWords, learnedIds, dateStr, perDay = WORDS_PER_DAY) {
  if (workdayIndex(dateStr) < 0) return [];
  const list = Array.isArray(weekWords) ? weekWords : [];
  const learned = Array.isArray(learnedIds) ? learnedIds : [];
  const fresh = list.filter((id) => !learned.includes(id));
  return fresh.slice(0, perDay);
}

/**
 * 4 选 1 小测出题（纯函数）
 * @param {{id:string}} target 正确项（字对象）
 * @param {Array} pool 全部字对象池
 * @param {Function} rand 随机函数（可注入）
 * @returns {{target:object, options:object[]}} 选项含正确项，最多 4 个
 */
export function makeWordQuiz(target, pool, rand = Math.random) {
  const all = Array.isArray(pool) ? pool : [];
  const others = all.filter((w) => w && w.id !== target.id);
  const wrong = shuffle(others, rand).slice(0, 3);
  const options = shuffle([target, ...wrong], rand);
  return { target, options };
}
