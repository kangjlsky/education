/* =========================================================
   数学领域逻辑（纯函数，无 DOM 依赖，可测试）
   - 阶段推进：完成当前阶段全部小游戏解锁下一阶段
   - 出题：数一数（数物品）、比大小（左右数量）
   ========================================================= */

import { MATH_STAGES } from '../data/math.js';

export const QUIZ_PER_ROUND = 3;

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
 * 当前应学习的阶段：第一个"有游戏且未全部完成"的阶段 id；
 * 全部游戏阶段完成返回 null（占位阶段不计入）
 */
export function currentStage(doneGames) {
  const done = doneGames && typeof doneGames === 'object' ? doneGames : {};
  for (const s of MATH_STAGES) {
    if (!s.games.length) continue;
    if (!s.games.every((g) => (done[s.id] || []).includes(g))) return s.id;
  }
  return null;
}

/** 阶段是否解锁（≤ 当前阶段） */
export function isStageUnlocked(stageId, doneGames) {
  const cur = currentStage(doneGames);
  return cur === null ? true : stageId <= cur;
}

/** 游戏所属阶段 id；未知返回 null */
export function gameStage(gameId) {
  for (const s of MATH_STAGES) {
    if (s.games.includes(gameId)) return s.id;
  }
  return null;
}

/**
 * 数一数出题：1-10 个物品，问数量，4 个选项
 */
export function makeCountQuestion(rand = Math.random) {
  const answer = 1 + Math.floor(rand() * 10);
  const candidates = [];
  for (let i = 1; i <= 10; i += 1) {
    if (i !== answer) candidates.push(i);
  }
  const wrongs = shuffle(candidates, rand).slice(0, 3);
  return {
    emojis: '🍎'.repeat(answer),
    answer,
    options: shuffle([answer, ...wrongs], rand),
  };
}

/**
 * 比大小出题：左右各若干物品，问哪边多（left/right 二选一）
 */
export function makeCompareQuestion(rand = Math.random) {
  const leftCount = 1 + Math.floor(rand() * 8);
  let rightCount = 1 + Math.floor(rand() * 8);
  while (rightCount === leftCount) {
    rightCount = 1 + Math.floor(rand() * 8);
  }
  return {
    leftCount,
    rightCount,
    emoji: '⭐',
    answer: leftCount > rightCount ? 'left' : 'right',
    options: ['left', 'right'],
  };
}
