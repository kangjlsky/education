/* =========================================================
   数学板块 - 6 阶段关卡配置
   阶段 1-2 已实现小游戏；阶段 3-6 占位（ticket 12 补全）
   ========================================================= */

export const MATH_STAGES = [
  { id: 1, name: '数感', ico: '🔢', desc: '数一数', games: ['count'] },
  { id: 2, name: '排序', ico: '📏', desc: '比大小', games: ['compare'] },
  { id: 3, name: '图形', ico: '🔷', desc: '找形状', games: [] },
  { id: 4, name: '加减', ico: '➕', desc: '算一算', games: [] },
  { id: 5, name: '钟表', ico: '🕐', desc: '认时钟', games: [] },
  { id: 6, name: '钱币', ico: '🪙', desc: '小超市', games: [] },
];

/** 游戏显示配置（出题函数在 boards/math.js 按 key 映射，避免 data→core 循环依赖） */
export const GAME_META = {
  count: { name: '数一数', ico: '🍎', prompt: '数一数，有几个？' },
  compare: { name: '比大小', ico: '⚖️', prompt: '哪边更多？' },
};
