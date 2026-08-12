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

/* ---------- 兑换申请流（孩子申请 → 家长确认） ---------- */

/**
 * 申请兑换：生成待确认申请（不扣减勋章；合计申请不超可用）
 * @param {{redeemed:number, history:Array, pending:Array}} medals 勋章状态
 * @returns {{ok:boolean, reason?:string, medals:Object}}
 */
export function applyRedeem(medals, stars, n, reward, date, id) {
  const m = medals && typeof medals === 'object' ? medals : { redeemed: 0, history: [], pending: [] };
  const pending = Array.isArray(m.pending) ? m.pending : [];
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, reason: 'invalid', medals: m };
  }
  const applied = pending.reduce((s, p) => s + (Number(p && p.n) || 0), 0);
  if (medalsAvailable(stars, m.redeemed) - applied < n) {
    return { ok: false, reason: 'insufficient', medals: m };
  }
  return { ok: true, medals: { ...m, pending: [...pending, { id, date, n, reward }] } };
}

/**
 * 确认发放：扣减勋章、记录兑换历史、移除申请
 */
export function confirmRedeem(medals, stars, id, date) {
  const m = medals && typeof medals === 'object' ? medals : { redeemed: 0, history: [], pending: [] };
  const pending = Array.isArray(m.pending) ? m.pending : [];
  const req = pending.find((p) => p && p.id === id);
  if (!req) {
    return { ok: false, reason: 'not-found', medals: m };
  }
  if (medalsAvailable(stars, m.redeemed) < req.n) {
    return { ok: false, reason: 'insufficient', medals: m };
  }
  const history = [
    ...(Array.isArray(m.history) ? m.history : []),
    { date, type: 'redeem', n: req.n, reward: req.reward },
  ];
  return {
    ok: true,
    medals: { ...m, redeemed: (m.redeemed || 0) + req.n, history, pending: pending.filter((p) => p.id !== id) },
  };
}

/**
 * 拒绝申请：仅移除申请，不扣勋章
 */
export function rejectRedeem(medals, id) {
  const m = medals && typeof medals === 'object' ? medals : { redeemed: 0, history: [], pending: [] };
  const pending = Array.isArray(m.pending) ? m.pending : [];
  if (!pending.some((p) => p && p.id === id)) {
    return { ok: false, reason: 'not-found', medals: m };
  }
  return { ok: true, medals: { ...m, pending: pending.filter((p) => p.id !== id) } };
}
