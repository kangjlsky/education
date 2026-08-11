/* =========================================================
   周计划生成（纯函数，无 DOM 依赖，可测试）
   每周一按设置从内容池取"未学"内容生成计划；
   未学不足时从已学内容循环补足（复习）
   ========================================================= */

/**
 * 从池中取 n 个：优先未学（按池序），不足时从已学中循环补足
 * @param {string[]} pool 内容池（id 列表）
 * @param {string[]} learnedIds 已学 id
 * @param {number} n 需要数量
 */
function takeFromPool(pool, learnedIds, n) {
  const all = Array.isArray(pool) ? pool : [];
  const learned = Array.isArray(learnedIds) ? learnedIds : [];
  if (!all.length) return [];
  const fresh = all.filter((id) => !learned.includes(id));
  if (fresh.length >= n) return fresh.slice(0, n);
  const rest = all.filter((id) => learned.includes(id));
  const fill = [];
  let i = 0;
  while (fresh.length + fill.length < n && rest.length) {
    fill.push(rest[i % rest.length]);
    i += 1;
  }
  return [...fresh, ...fill];
}

/**
 * 生成一周计划（纯函数）
 * @param {string} weekStart 周一起始日 YYYY-MM-DD
 * @param {{poems:number, words:number, books:number}} counts 各科每周数量
 * @param {{poems:string[], words:string[], books:string[]}} pool 内容池
 * @param {{poems:string[], words:string[], books:string[]}} learned 已学 id
 */
export function buildWeekPlan(weekStart, counts, pool, learned) {
  const p = pool && typeof pool === 'object' ? pool : {};
  const l = learned && typeof learned === 'object' ? learned : {};
  return {
    weekStart,
    poems: takeFromPool(p.poems, l.poems, counts.poems),
    words: takeFromPool(p.words, l.words, counts.words),
    books: takeFromPool(p.books, l.books, counts.books),
  };
}
