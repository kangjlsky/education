import { describe, it, expect } from 'vitest';
import { MEDAL_EVERY, medalsEarned, medalsAvailable, newMedals, redeem } from '../js/core/medals.js';

describe('勋章引擎', () => {
  it('medalsEarned：每 5 星光 1 枚，向下取整', () => {
    expect(medalsEarned(0)).toBe(0);
    expect(medalsEarned(4)).toBe(0);
    expect(medalsEarned(5)).toBe(1);
    expect(medalsEarned(9)).toBe(1);
    expect(medalsEarned(12)).toBe(2);
  });

  it('medalsAvailable：已获得减去已兑换，不为负', () => {
    expect(medalsAvailable(12, 0)).toBe(2);
    expect(medalsAvailable(12, 1)).toBe(1);
    expect(medalsAvailable(12, 3)).toBe(0);
    expect(medalsAvailable(5, 1)).toBe(0);
  });

  it('newMedals：跨过 5 的倍数时产出的新勋章数', () => {
    expect(newMedals(4, 5)).toBe(1);
    expect(newMedals(9, 10)).toBe(1);
    expect(newMedals(0, 5)).toBe(1);
    expect(newMedals(12, 13)).toBe(0); // 未跨阈值
    expect(newMedals(10, 15)).toBe(1);
    expect(newMedals(9, 15)).toBe(2);
  });

  it('redeem：兑换成功则已兑换数增加', () => {
    const r = redeem(12, 0, 2);
    expect(r.ok).toBe(true);
    expect(r.redeemed).toBe(2);
  });

  it('redeem：勋章不足拒绝', () => {
    const r = redeem(12, 1, 2); // 可用 1 枚
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('insufficient');
  });

  it('redeem：非法数量拒绝（非正整数）', () => {
    expect(redeem(12, 0, 0).reason).toBe('invalid');
    expect(redeem(12, 0, -1).reason).toBe('invalid');
    expect(redeem(12, 0, 2.5).reason).toBe('invalid');
    expect(redeem(12, 0, '2').reason).toBe('invalid');
  });

  it('redeem：兑换后可用数正确变化', () => {
    const r = redeem(15, 0, 2); // 已获得 3 枚
    expect(r.ok).toBe(true);
    expect(medalsAvailable(15, r.redeemed)).toBe(1);
  });

  it('MEDAL_EVERY 常量 = 5', () => {
    expect(MEDAL_EVERY).toBe(5);
  });
});
