import { describe, it, expect } from 'vitest';
import { buildWeekPlan } from '../js/core/plan.js';

describe('周计划生成', () => {
  const pool = {
    poems: ['p1', 'p2', 'p3', 'p4', 'p5'],
    words: ['w1', 'w2', 'w3'],
    books: [],
  };

  it('取未学内容的前 N 个，数量遵循 counts', () => {
    const plan = buildWeekPlan('2026-08-10', { poems: 3, words: 2, books: 1 }, pool, { poems: [], words: [], books: [] });
    expect(plan.weekStart).toBe('2026-08-10');
    expect(plan.poems).toEqual(['p1', 'p2', 'p3']);
    expect(plan.words).toEqual(['w1', 'w2']);
    expect(plan.books).toEqual([]); // 空池返回空
  });

  it('跳过已学内容', () => {
    const plan = buildWeekPlan('2026-08-10', { poems: 3, words: 0, books: 0 }, pool, { poems: ['p1', 'p2'], words: [], books: [] });
    expect(plan.poems).toEqual(['p3', 'p4', 'p5']);
  });

  it('未学不足时从已学内容循环补足', () => {
    const plan = buildWeekPlan('2026-08-10', { poems: 3, words: 0, books: 0 }, pool, { poems: ['p1', 'p2', 'p3', 'p4', 'p5'], words: [], books: [] });
    expect(plan.poems).toHaveLength(3);
    expect(plan.poems).toEqual(['p1', 'p2', 'p3']); // 全部已学 → 从池首补足
  });

  it('部分已学：先取未学，不足再补已学', () => {
    const plan = buildWeekPlan('2026-08-10', { poems: 3, words: 0, books: 0 }, pool, { poems: ['p1'], words: [], books: [] });
    expect(plan.poems).toEqual(['p2', 'p3', 'p4']); // 未学足够则不补
  });

  it('空池与缺失字段防御', () => {
    const plan = buildWeekPlan('2026-08-10', { poems: 3, words: 2, books: 1 }, {}, {});
    expect(plan.poems).toEqual([]);
    expect(plan.words).toEqual([]);
    expect(plan.books).toEqual([]);
  });

  it('learned 缺省视为未学', () => {
    const plan = buildWeekPlan('2026-08-10', { poems: 2, words: 0, books: 0 }, pool, null);
    expect(plan.poems).toEqual(['p1', 'p2']);
  });
});
