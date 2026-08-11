import { describe, it, expect } from 'vitest';
import { WORDS_PER_DAY, workdayIndex, pickDailyNewWords, makeWordQuiz } from '../js/core/words.js';

describe('识字领域逻辑', () => {
  describe('workdayIndex（一周工作日序号）', () => {
    it('周一到周五为 0-4，周六日为 -1', () => {
      expect(workdayIndex('2026-08-10')).toBe(0); // 周一
      expect(workdayIndex('2026-08-12')).toBe(2); // 周三
      expect(workdayIndex('2026-08-14')).toBe(4); // 周五
      expect(workdayIndex('2026-08-15')).toBe(-1); // 周六
      expect(workdayIndex('2026-08-16')).toBe(-1); // 周日
    });
  });

  describe('pickDailyNewWords（未学锚定，支持补学）', () => {
    const weekWords = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10'];
    it('全部未学时取前 2 个', () => {
      expect(pickDailyNewWords(weekWords, [], '2026-08-10')).toEqual(['w1', 'w2']);
    });
    it('已学的被跳过，缺席可在之后几天补学', () => {
      expect(pickDailyNewWords(weekWords, ['w1', 'w2'], '2026-08-11')).toEqual(['w3', 'w4']);
      // 周一缺席（未学 w1/w2），周二仍先补 w1/w2
      expect(pickDailyNewWords(weekWords, [], '2026-08-11')).toEqual(['w1', 'w2']);
    });
    it('周六日无新字', () => {
      expect(pickDailyNewWords(weekWords, [], '2026-08-15')).toEqual([]);
      expect(pickDailyNewWords(weekWords, [], '2026-08-16')).toEqual([]);
    });
    it('本周计划全部已学则无新字', () => {
      expect(pickDailyNewWords(weekWords, [...weekWords], '2026-08-10')).toEqual([]);
    });
    it('自定义每日数量', () => {
      expect(pickDailyNewWords(weekWords, [], '2026-08-10', 3)).toEqual(['w1', 'w2', 'w3']);
    });
    it('非数组/空计划防御', () => {
      expect(pickDailyNewWords(null, [], '2026-08-10')).toEqual([]);
      expect(pickDailyNewWords([], [], '2026-08-10')).toEqual([]);
    });
  });

  describe('makeWordQuiz（4 选 1 出题）', () => {
    const pool = [
      { id: 'w1', char: '人' },
      { id: 'w2', char: '手' },
      { id: 'w3', char: '口' },
      { id: 'w4', char: '山' },
      { id: 'w5', char: '水' },
    ];
    const target = pool[0];

    it('选项 4 个、含正确项、干扰项不重复', () => {
      const q = makeWordQuiz(target, pool);
      expect(q.target.id).toBe('w1');
      expect(q.options).toHaveLength(4);
      expect(q.options.some((o) => o.id === 'w1')).toBe(true);
      const ids = q.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(4);
    });
    it('干扰项均来自字库且与正确项不同', () => {
      const q = makeWordQuiz(target, pool, () => 0.5);
      const wrong = q.options.filter((o) => o.id !== 'w1');
      expect(wrong).toHaveLength(3);
      expect(wrong.every((o) => pool.some((p) => p.id === o.id))).toBe(true);
    });
    it('字库不足 4 个时选项数量受限但不报错', () => {
      const small = pool.slice(0, 2);
      const q = makeWordQuiz(target, small);
      expect(q.options.length).toBeGreaterThanOrEqual(1);
      expect(q.options.some((o) => o.id === 'w1')).toBe(true);
    });
  });

  it('WORDS_PER_DAY = 2', () => {
    expect(WORDS_PER_DAY).toBe(2);
  });
});
