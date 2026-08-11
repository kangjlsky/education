import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PASSWORD,
  MAX_ATTEMPTS,
  LOCK_MS,
  createState,
  verify,
  changePassword,
  isLocked,
} from '../js/core/password.js';

describe('密码校验（家长模式）', () => {
  const now = 1_000_000;

  it('初始状态：默认密码 0000，且标记需强制修改', () => {
    const s = createState(now);
    expect(s.password).toBe(DEFAULT_PASSWORD);
    expect(s.mustChange).toBe(true);
    expect(s.attempts).toBe(0);
    expect(s.lockedUntil).toBe(0);
  });

  it('输入正确密码验证通过，并重置错误次数', () => {
    let s = createState(now);
    s = { ...s, attempts: 2 };
    const r = verify(DEFAULT_PASSWORD, s, now);
    expect(r.ok).toBe(true);
    expect(r.state.attempts).toBe(0);
    expect(r.state.mustChange).toBe(false);
  });

  it('输入错误密码，错误次数 +1', () => {
    const s = createState(now);
    const r = verify('1111', s, now);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('wrong');
    expect(r.state.attempts).toBe(1);
  });

  it('连续错误达到上限后锁定 30 秒', () => {
    let s = createState(now);
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      s = verify('1111', s, now).state;
    }
    expect(isLocked(s, now)).toBe(true);
    expect(s.lockedUntil).toBe(now + LOCK_MS);
    expect(s.attempts).toBe(0); // 锁定后错误计数复位
  });

  it('触发锁定的那一次提交：返回状态立即进入锁定', () => {
    let s = createState(now);
    s = verify('1111', s, now).state;
    s = verify('1111', s, now).state;
    const r = verify('1111', s, now); // 第 3 次：本次提交触发锁定
    expect(r.ok).toBe(false);
    expect(isLocked(r.state, now)).toBe(true);
    expect(r.state.lockedUntil).toBe(now + LOCK_MS);
  });

  it('锁定期间即使输入正确密码也被拒绝', () => {
    let s = createState(now);
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      s = verify('1111', s, now).state;
    }
    const r = verify(DEFAULT_PASSWORD, s, now + 10_000); // 锁定中
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('locked');
    expect(r.remainingMs).toBeGreaterThan(0);
  });

  it('锁定过期后可以重新尝试，正确密码通过', () => {
    let s = createState(now);
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      s = verify('1111', s, now).state;
    }
    const after = now + LOCK_MS + 1;
    expect(isLocked(s, after)).toBe(false);
    const r = verify(DEFAULT_PASSWORD, s, after);
    expect(r.ok).toBe(true);
  });

  it('修改密码：拒绝非 4 位数字', () => {
    const s = createState(now);
    for (const bad of ['123', '12345', '12ab', '']) {
      const r = changePassword(bad, s);
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('invalid');
    }
  });

  it('修改密码：拒绝与初始默认密码相同', () => {
    const s = createState(now);
    const r = changePassword(DEFAULT_PASSWORD, s);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('same-as-default');
  });

  it('修改密码：合法后密码更新、强制修改标记清除', () => {
    const s = createState(now);
    const r = changePassword('2468', s);
    expect(r.ok).toBe(true);
    expect(r.state.password).toBe('2468');
    expect(r.state.mustChange).toBe(false);
    expect(verify('2468', r.state, now).ok).toBe(true);
    expect(verify('0000', r.state, now).ok).toBe(false);
  });
});
