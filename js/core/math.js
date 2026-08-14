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

/* =========================================================
   阶段 3-6 出题（图形 / 加减 / 钟表 / 钱币）
   ========================================================= */

/** 基础图形池 */
export const SHAPES = ['🔺', '⭕', '🟦', '⭐', '❤️', '🔷'];

/** 整点时钟 emoji（1-12 点） */
export const CLOCK_HOUR_EMOJIS = {
  1: '🕐', 2: '🕑', 3: '🕒', 4: '🕓', 5: '🕔', 6: '🕕',
  7: '🕖', 8: '🕗', 9: '🕘', 10: '🕙', 11: '🕚', 12: '🕛',
};

/** 半点时钟 emoji（1-12 点半） */
export const CLOCK_HALF_EMOJIS = {
  1: '🕜', 2: '🕝', 3: '🕞', 4: '🕟', 5: '🕠', 6: '🕡',
  7: '🕢', 8: '🕣', 9: '🕤', 10: '🕥', 11: '🕦', 12: '🕧',
};

/** 小超市商品池 */
export const SHOP_ITEMS = [
  { ico: '🍎', name: '苹果', price: 3 },
  { ico: '🍭', name: '棒棒糖', price: 2 },
  { ico: '🥤', name: '汽水', price: 5 },
  { ico: '✏️', name: '铅笔', price: 1 },
  { ico: '🎂', name: '蛋糕', price: 8 },
  { ico: '🚗', name: '玩具车', price: 10 },
];

/** 数字选项生成：答案 + 3 个干扰（范围 [min, max]） */
function numericOptions(answer, rand, min, max) {
  const candidates = [];
  for (let i = min; i <= max; i += 1) {
    if (i !== answer) candidates.push(i);
  }
  const wrongs = shuffle(candidates, rand).slice(0, 3);
  return shuffle([answer, ...wrongs], rand);
}

/** 找图形：4 个唯一图形选项，目标为其中之一 */
export function makeShapeFindQuestion(rand = Math.random) {
  const target = SHAPES[Math.floor(rand() * SHAPES.length)];
  const wrongs = shuffle(SHAPES.filter((s) => s !== target), rand).slice(0, 3);
  return { target, answer: target, options: shuffle([target, ...wrongs], rand) };
}

/** 数图形：图形串中目标图形个数，问有多少个 */
export function makeShapeCountQuestion(rand = Math.random) {
  const target = SHAPES[Math.floor(rand() * SHAPES.length)];
  const answer = 1 + Math.floor(rand() * 4); // 目标 1-4 个
  const total = answer + 2 + Math.floor(rand() * 3); // 总 3-6 个
  const others = SHAPES.filter((s) => s !== target);
  const emojis = [];
  for (let i = 0; i < answer; i += 1) emojis.push(target);
  while (emojis.length < total) {
    emojis.push(others[Math.floor(rand() * others.length)]);
  }
  return { target, emojis: shuffle(emojis, rand).join(''), answer, options: numericOptions(answer, rand, 1, 6) };
}

/** 加法口算（和 ≤ max） */
export function makeAddQuestion(max = 10, rand = Math.random) {
  const a = 1 + Math.floor(rand() * (max - 1));
  const b = 1 + Math.floor(rand() * (max - a));
  const answer = a + b;
  return { a, b, op: '+', answer, options: numericOptions(answer, rand, 1, max + 5) };
}

/** 减法口算（差 ≥ 0） */
export function makeSubQuestion(max = 10, rand = Math.random) {
  const a = 1 + Math.floor(rand() * max);
  const b = 1 + Math.floor(rand() * a);
  const answer = a - b;
  return { a, b, op: '-', answer, options: numericOptions(answer, rand, 0, max) };
}

/** 加减混合（默认 20 以内） */
export function makeMixArithQuestion(max = 20, rand = Math.random) {
  return rand() < 0.5 ? makeAddQuestion(max, rand) : makeSubQuestion(max, rand);
}

/** 钟表认读（整点/半点），用时钟 emoji */
export function makeClockQuestion(half = false, rand = Math.random) {
  const hour = 1 + Math.floor(rand() * 12);
  const emojis = half ? CLOCK_HALF_EMOJIS : CLOCK_HOUR_EMOJIS;
  const answer = half ? `${hour} 点半` : `${hour} 点`;
  const labels = [];
  for (let h = 1; h <= 12; h += 1) {
    const t = half ? `${h} 点半` : `${h} 点`;
    if (t !== answer) labels.push(t);
  }
  const wrongs = shuffle(labels, rand).slice(0, 3);
  return { emoji: emojis[hour], hour, half, answer, options: shuffle([answer, ...wrongs], rand) };
}

/** 认钱币面值：显示"X 元"，选对应数字 */
export function makeMoneyValueQuestion(rand = Math.random) {
  const values = [1, 5, 10, 20, 50, 100];
  const answer = values[Math.floor(rand() * values.length)];
  const wrongs = shuffle(values.filter((v) => v !== answer), rand).slice(0, 3);
  return { text: `${answer} 元`, answer, options: shuffle([answer, ...wrongs], rand) };
}

/** 小超市购物：显示商品与价格，选应付金额 */
export function makeMoneyShopQuestion(rand = Math.random) {
  const item = SHOP_ITEMS[Math.floor(rand() * SHOP_ITEMS.length)];
  return {
    ico: item.ico,
    name: item.name,
    price: item.price,
    answer: item.price,
    options: numericOptions(item.price, rand, 1, 12),
  };
}
