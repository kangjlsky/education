/* =========================================================
   家长模式密码校验（纯函数，无 DOM 依赖，可测试）
   规则：默认密码 0000；首次进入强制修改；连续错 3 次锁定 30 秒
   ========================================================= */

export const DEFAULT_PASSWORD = '0000';
export const MAX_ATTEMPTS = 3;
export const LOCK_MS = 30_000;

/** 创建初始密码状态 */
export function createState(now = Date.now()) {
  return { password: DEFAULT_PASSWORD, attempts: 0, lockedUntil: 0, mustChange: true };
}

/** 当前是否处于锁定状态 */
export function isLocked(state, now = Date.now()) {
  return now < state.lockedUntil;
}

/**
 * 校验密码（纯函数，返回新状态，不修改入参）
 * 锁定期间一律拒绝（含正确密码）；连续错误达到上限后锁定 LOCK_MS 毫秒
 */
export function verify(input, state, now = Date.now()) {
  if (isLocked(state, now)) {
    return { ok: false, state, reason: 'locked', remainingMs: state.lockedUntil - now };
  }
  if (input === state.password) {
    return { ok: true, state: { ...state, attempts: 0, mustChange: false } };
  }
  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    return { ok: false, state: { ...state, attempts: 0, lockedUntil: now + LOCK_MS }, reason: 'wrong' };
  }
  return { ok: false, state: { ...state, attempts }, reason: 'wrong' };
}

/**
 * 修改密码（纯函数）：仅接受 4 位数字，且不得与初始默认密码相同；
 * 成功后清除强制修改标记
 */
export function changePassword(newPassword, state) {
  if (!/^\d{4}$/.test(newPassword)) {
    return { ok: false, state, reason: 'invalid' };
  }
  if (newPassword === DEFAULT_PASSWORD) {
    return { ok: false, state, reason: 'same-as-default' };
  }
  return { ok: true, state: { ...state, password: newPassword, mustChange: false, attempts: 0 } };
}
