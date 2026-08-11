import { describe, it, expect } from 'vitest';
import {
  REVIEW_INTERVALS,
  isSunday,
  isSaturday,
  daysBetween,
  pickReviewWords,
  pickPoemReview,
  dailyTargets,
} from '../js/core/review.js';

describe('复习调度', () => {
  describe('星期判断', () => {
    it('isSunday：2026-08-16 是周日', () => {
      expect(isSunday('2026-08-16')).toBe(true);
      expect(isSunday('2026-08-17')).toBe(false);
    });
    it('isSaturday：2026-08-15 是周六', () => {
      expect(isSaturday('2026-08-15')).toBe(true);
      expect(isSaturday('2026-08-16')).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('同月与跨月天数差', () => {
      expect(daysBetween('2026-08-10', '2026-08-11')).toBe(1);
      expect(daysBetween('2026-08-31', '2026-09-03')).toBe(3);
      expect(daysBetween('2026-08-11', '2026-08-10')).toBe(-1);
    });
  });

  describe('pickReviewWords（1/3/7 天间隔）', () => {
    const learned = {
      w1: '2026-08-01', // 距 08-10 是 9 天 → 不复习
      w2: '2026-08-09', // 距 08-10 是 1 天 → 复习
      w3: '2026-08-07', // 距 08-10 是 3 天 → 复习
      w4: '2026-08-03', // 距 08-10 是 7 天 → 复习
      w5: '2026-08-05', // 距 08-10 是 5 天 → 不复习
    };
    it('只选中学后第 1/3/7 天到期的字', () => {
      const due = pickReviewWords(learned, '2026-08-10');
      expect(due.sort()).toEqual(['w2', 'w3', 'w4']);
    });
    it('空对象与缺省间隔', () => {
      expect(pickReviewWords({}, '2026-08-10')).toEqual([]);
      expect(pickReviewWords(null, '2026-08-10')).toEqual([]);
    });
    it('自定义间隔', () => {
      const due = pickReviewWords(learned, '2026-08-10', [9]);
      expect(due).toEqual(['w1']);
    });
    it('REVIEW_INTERVALS = [1,3,7]', () => {
      expect(REVIEW_INTERVALS).toEqual([1, 3, 7]);
    });
  });

  describe('pickPoemReview（周日复习：本周 + 旧诗抽查）', () => {
    it('包含本周计划全部古诗 + 抽查 count 首旧诗', () => {
      const ids = pickPoemReview(['p1', 'p2', 'p3'], ['p1', 'p2', 'p3', 'old1', 'old2', 'old3'], 2, Math.random);
      expect(ids.slice(0, 3)).toEqual(['p1', 'p2', 'p3']);
      expect(ids).toHaveLength(5);
    });
    it('抽查数量遵循 count', () => {
      const ids = pickPoemReview(['p1'], ['p1', 'o1', 'o2', 'o3'], 3, Math.random);
      expect(ids).toHaveLength(4);
    });
    it('抽查的旧诗不含本周计划中的诗', () => {
      const ids = pickPoemReview(['p1'], ['p1', 'o1', 'o2'], 2, Math.random);
      const extra = ids.slice(1);
      expect(extra).toHaveLength(2);
      expect(extra).not.toContain('p1');
      expect(extra.every((id) => ['o1', 'o2'].includes(id))).toBe(true);
    });
    it('没有旧诗时只返回本周计划', () => {
      const ids = pickPoemReview(['p1', 'p2'], ['p1', 'p2'], 2, Math.random);
      expect(ids).toEqual(['p1', 'p2']);
    });
    it('rand 返回上界 1 时不越界且元素集合不变', () => {
      const ids = pickPoemReview(['p1'], ['p1', 'o1', 'o2', 'o3'], 3, () => 1);
      expect(ids).toHaveLength(4);
      expect(new Set(ids)).toEqual(new Set(['p1', 'o1', 'o2', 'o3']));
    });
  });

  describe('dailyTargets（今日任务清单）', () => {
    const weekPlan = { weekStart: '2026-08-10', poems: ['p1', 'p2', 'p3'], reviewPoems: ['o1', 'o2'] };

    it('普通日：任务 = 本周计划古诗', () => {
      const t = dailyTargets('2026-08-12', weekPlan);
      expect(t).toEqual([
        { subject: 'poems', item: 'p1' },
        { subject: 'poems', item: 'p2' },
        { subject: 'poems', item: 'p3' },
      ]);
    });

    it('周日：追加复习抽查诗（标记 review，去重）', () => {
      const t = dailyTargets('2026-08-16', weekPlan);
      expect(t).toHaveLength(5);
      expect(t.slice(3)).toEqual([
        { subject: 'poems', item: 'o1', review: true },
        { subject: 'poems', item: 'o2', review: true },
      ]);
    });

    it('无 reviewPoems 的周日：只有本周计划', () => {
      const t = dailyTargets('2026-08-16', { weekStart: '2026-08-10', poems: ['p1'] });
      expect(t).toHaveLength(1);
    });
  });
});
