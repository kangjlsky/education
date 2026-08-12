import { describe, it, expect } from 'vitest';
import { MEDAL_EVERY, medalsEarned, medalsAvailable, newMedals, redeem, applyRedeem, confirmRedeem, rejectRedeem } from '../js/core/medals.js';

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

  describe('兑换申请流（applyRedeem/confirmRedeem/rejectRedeem）', () => {
    const mk = (n, reward, id) => ({ id, date: '2026-08-10', n, reward });
    const base = { redeemed: 0, history: [], pending: [] };

    it('applyRedeem：可用勋章足够时生成待确认申请（不扣减）', () => {
      const r = applyRedeem(base, 12, 2, '零食一次', '2026-08-10', 'r1'); // 可用 2 枚
      expect(r.ok).toBe(true);
      expect(r.medals.pending).toHaveLength(1);
      expect(r.medals.redeemed).toBe(0); // 申请不扣减
    });

    it('applyRedeem：不足或非法拒绝', () => {
      expect(applyRedeem(base, 12, 3, 'x', '2026-08-10', 'r1').reason).toBe('insufficient'); // 可用 2 < 3
      expect(applyRedeem(base, 12, 0, 'x', '2026-08-10', 'r1').reason).toBe('invalid');
      expect(applyRedeem(base, 12, 2.5, 'x', '2026-08-10', 'r1').reason).toBe('invalid');
    });

    it('applyRedeem：多个申请合计不能超过可用勋章', () => {
      const a = applyRedeem(base, 12, 2, 'a', '2026-08-10', 'r1'); // 申请 2
      const b = applyRedeem(a.medals, 12, 1, 'b', '2026-08-10', 'r2'); // 再申请 1 → 2+1=3 > 2 拒绝
      expect(b.ok).toBe(false);
      expect(b.reason).toBe('insufficient');
    });

    it('confirmRedeem：确认后扣减勋章并记录兑换历史、移除申请', () => {
      const a = applyRedeem(base, 12, 2, '零食一次', '2026-08-10', 'r1');
      const r = confirmRedeem(a.medals, 12, 'r1', '2026-08-10');
      expect(r.ok).toBe(true);
      expect(r.medals.redeemed).toBe(2);
      expect(r.medals.pending).toHaveLength(0);
      expect(r.medals.history).toHaveLength(1);
      expect(r.medals.history[0]).toMatchObject({ type: 'redeem', n: 2, reward: '零食一次' });
    });

    it('confirmRedeem：申请不存在拒绝', () => {
      const r = confirmRedeem(base, 12, 'nope', '2026-08-10');
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('not-found');
    });

    it('rejectRedeem：拒绝仅移除申请、不扣勋章', () => {
      const a = applyRedeem(base, 12, 2, 'x', '2026-08-10', 'r1');
      const r = rejectRedeem(a.medals, 'r1');
      expect(r.ok).toBe(true);
      expect(r.medals.pending).toHaveLength(0);
      expect(r.medals.redeemed).toBe(0);
      expect(r.medals.history).toHaveLength(0);
    });
  });
});
