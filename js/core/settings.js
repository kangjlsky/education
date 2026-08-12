/* =========================================================
   家长设置（纯函数，无 DOM 依赖，可测试）
   存于 ning.config；normalizeConfig 防脏数据/补齐缺省
   ========================================================= */

export const DEFAULT_CONFIG = {
  childName: '柠柠',
  petTheme: 'dino',
  weekly: { poems: 3, words: 10, books: 3, penDaily: 2 },
  redeem: [
    { medals: 2, reward: '零食一次' },
    { medals: 3, reward: '动画片 1 集' },
    { medals: 5, reward: '5 元零花钱' },
  ],
};

const WEEKLY_RANGE = { min: 1, max: 50 };

/**
 * 规范化设置（纯函数）：补齐缺失字段、钳制数值、防御脏数据
 */
export function normalizeConfig(raw) {
  const base = DEFAULT_CONFIG;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      childName: base.childName,
      petTheme: base.petTheme,
      weekly: { ...base.weekly },
      redeem: base.redeem.map((r) => ({ ...r })),
    };
  }

  // 周任务量：数值钳制，非法回退默认
  const weekly = { ...base.weekly, ...(raw.weekly && typeof raw.weekly === 'object' && !Array.isArray(raw.weekly) ? raw.weekly : {}) };
  for (const key of Object.keys(weekly)) {
    const n = Number(weekly[key]);
    weekly[key] =
      Number.isFinite(n) && n >= WEEKLY_RANGE.min && n <= WEEKLY_RANGE.max ? Math.floor(n) : base.weekly[key];
  }

  // 兑换档位：规范化 { medals: 数字, reward: 字符串 }
  const redeem = Array.isArray(raw.redeem) && raw.redeem.length
    ? raw.redeem.map((r) => ({
        medals: Number.isFinite(Number(r && r.medals)) && Number(r.medals) > 0 ? Math.floor(Number(r.medals)) : 1,
        reward: typeof (r && r.reward) === 'string' && r.reward.trim() ? r.reward.trim() : '小奖励',
      }))
    : base.redeem.map((r) => ({ ...r }));

  return {
    childName: typeof raw.childName === 'string' && raw.childName.trim() ? raw.childName.trim() : base.childName,
    petTheme: typeof raw.petTheme === 'string' && raw.petTheme.trim() ? raw.petTheme.trim() : base.petTheme,
    weekly,
    redeem,
  };
}
