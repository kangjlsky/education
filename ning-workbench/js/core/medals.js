/* =========================================================
   勋章引擎（纯函数，无 DOM 依赖，可测试）
   规则：每集齐 5 星光自动获得 1 枚勋章；
   勋章数 = floor(累计星光 / 5) - 已兑换数（兑换扣减不影响星光）
   ========================================================= */

export const MEDAL_EVERY = 5;

/** 按累计星光折算的勋章总数（含已兑换） */
export function medalsEarned(stars) {
  return Math.floor((stars || 0) / MEDAL_EVERY);
}

/** 当前可用勋章数（已获得 - 已兑换，不为负） */
export function medalsAvailable(stars, redeemed) {
  return Math.max(0, medalsEarned(stars) - (redeemed || 0));
}

/** 星光从 before 到 after 期间新获得的勋章数（跨过 5 的倍数） */
export function newMedals(beforeStars, afterStars) {
  return Math.max(0, medalsEarned(afterStars) - medalsEarned(beforeStars));
}

/**
 * 兑换勋章（纯函数）
 * @returns {{ok:boolean, reason?:string, redeemed:number}}
 */
export function redeem(stars, redeemed, n) {
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, reason: 'invalid', redeemed: redeemed || 0 };
  }
  if (medalsAvailable(stars, redeemed) < n) {
    return { ok: false, reason: 'insufficient', redeemed: redeemed || 0 };
  }
  return { ok: true, redeemed: (redeemed || 0) + n };
}
