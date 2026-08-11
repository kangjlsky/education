/* =========================================================
   复习调度（纯函数，无 DOM 依赖，可测试）
   - 生字：学后第 1/3/7 天进入滚动复习
   - 古诗：周日复习本周计划 + 随机抽查旧诗
   - 英语：每周六复盘本周内容
   ========================================================= */

export const REVIEW_INTERVALS = [1, 3, 7];

/** 周日判断（YYYY-MM-DD） */
export function isSunday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

/** 周六判断（YYYY-MM-DD） */
export function isSaturday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 6;
}

/** 两个日期字符串的天数差（from 到 to） */
export function daysBetween(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = new Date(fy, fm - 1, fd);
  const b = new Date(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

/**
 * 生字间隔复习：学后第 1/3/7 天到期的字
 * @param {{id:string}[]|Object} learnedMap { id: learnDate } 或数组 [{id, date}]
 */
export function pickReviewWords(learnedMap, today, intervals = REVIEW_INTERVALS) {
  if (!learnedMap || typeof learnedMap !== 'object') return [];
  const entries = Array.isArray(learnedMap)
    ? learnedMap.map((x) => [x.id, x.date])
    : Object.entries(learnedMap);
  return entries
    .filter(([, date]) => date && intervals.includes(daysBetween(date, today)))
    .map(([id]) => id);
}

/** Fisher-Yates 洗牌（rand 可注入，固定 rand 时结果确定） */
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    // 钳制上界，防 rand()==1 时索引越界（默认 Math.random 返回 [0,1) 无此风险）
    const j = Math.min(i, Math.floor(rand() * (i + 1)));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 周日古诗复习：本周计划古诗 + 随机抽查 count 首旧诗（不含本周计划）
 * @param {string[]} weekPlanIds 本周计划古诗
 * @param {string[]} learnedIds 全部已学古诗
 * @param {number} count 抽查数量
 * @param {Function} rand 随机函数（可注入以便测试）
 */
export function pickPoemReview(weekPlanIds, learnedIds, count = 2, rand = Math.random) {
  const week = Array.isArray(weekPlanIds) ? weekPlanIds : [];
  const learned = Array.isArray(learnedIds) ? learnedIds : [];
  const oldOnes = learned.filter((id) => !week.includes(id));
  const shuffled = shuffle(oldOnes, rand);
  return [...week, ...shuffled.slice(0, count)];
}

/**
 * 今日任务清单（纯函数）
 * 普通日 = 本周计划古诗；周日追加复习抽查诗（review: true，去重）
 * @param {string} dateStr 今天 YYYY-MM-DD
 * @param {{poems:string[], reviewPoems?:string[]}} weekPlan 本周计划
 */
export function dailyTargets(dateStr, weekPlan) {
  const poems = Array.isArray(weekPlan?.poems) ? weekPlan.poems : [];
  const targets = poems.map((id) => ({ subject: 'poems', item: id }));
  if (isSunday(dateStr) && Array.isArray(weekPlan?.reviewPoems)) {
    for (const id of weekPlan.reviewPoems) {
      if (!targets.some((t) => t.item === id)) {
        targets.push({ subject: 'poems', item: id, review: true });
      }
    }
  }
  return targets;
}
