/* =========================================================
   数学板块 - 6 阶段关卡配置
   全部阶段已实现小游戏；每阶段 1-3 个游戏
   ========================================================= */

export const MATH_STAGES = [
  { id: 1, name: '数感', ico: '🔢', desc: '数一数', games: ['count'] },
  { id: 2, name: '排序', ico: '📏', desc: '比大小', games: ['compare'] },
  { id: 3, name: '图形', ico: '🔷', desc: '认图形', games: ['shape_find', 'shape_count'] },
  { id: 4, name: '加减', ico: '➕', desc: '算一算', games: ['add10', 'sub10', 'mix20'] },
  { id: 5, name: '钟表', ico: '🕐', desc: '认时钟', games: ['clock_hour', 'clock_half'] },
  { id: 6, name: '钱币', ico: '🪙', desc: '小超市', games: ['money_value', 'money_shop'] },
];

/**
 * 游戏显示配置与出题类型
 * type 决定渲染方式：
 *   count  数一数（emoji 串 + 数字选项）
 *   side   二选一（左右对比）
 *   emoji  目标图形 + 图形选项
 *   arith  算式 + 数字选项
 *   clock  时钟 emoji + 时间文字选项
 *   money  金额文字 + 数字选项
 *   shop   商品 + 数字选项
 */
export const GAME_META = {
  count: { name: '数一数', ico: '🍎', prompt: '数一数，有几个？', type: 'count' },
  compare: { name: '比大小', ico: '⚖️', prompt: '哪边更多？', type: 'side' },
  shape_find: { name: '找图形', ico: '🔺', prompt: '找到一样的图形', type: 'emoji' },
  shape_count: { name: '数图形', ico: '🔷', prompt: '数一数有几个？', type: 'count' },
  add10: { name: '加法口算', ico: '➕', prompt: '算一算等于几？', type: 'arith' },
  sub10: { name: '减法口算', ico: '➖', prompt: '算一算等于几？', type: 'arith' },
  mix20: { name: '加减混合', ico: '➕', prompt: '算一算等于几？', type: 'arith' },
  clock_hour: { name: '整点认读', ico: '🕒', prompt: '现在是几点？', type: 'clock' },
  clock_half: { name: '半点认读', ico: '🕜', prompt: '现在是几点？', type: 'clock' },
  money_value: { name: '认钱币', ico: '💵', prompt: '这是多少钱？', type: 'money' },
  money_shop: { name: '小超市', ico: '🛒', prompt: '要付多少钱？', type: 'shop' },
};
