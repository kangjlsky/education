import { describe, it, expect } from 'vitest';
import { CLASSICS_PER_TEN, unlockedClassics, nextClassicIn } from '../js/core/classics.js';

describe('古文解锁', () => {
  it('未学满 10 首古诗：无古文解锁', () => {
    expect(unlockedClassics(0, 6)).toEqual([]);
    expect(unlockedClassics(9, 6)).toEqual([]);
  });

  it('学满 10 首解锁第 1 篇，20 首解锁前 2 篇', () => {
    expect(unlockedClassics(10, 6)).toEqual([0]);
    expect(unlockedClassics(20, 6)).toEqual([0, 1]);
  });

  it('25 首解锁前 2 篇（未满 30）', () => {
    expect(unlockedClassics(25, 6)).toEqual([0, 1]);
  });

  it('全部解锁：学满 60 首解锁 6 篇', () => {
    expect(unlockedClassics(60, 6)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('数量上限：超出总篇数时只到最后一篇', () => {
    expect(unlockedClassics(100, 6)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('nextClassicIn：距下一篇古文还需学几首', () => {
    expect(nextClassicIn(0)).toBe(10);
    expect(nextClassicIn(9)).toBe(1);
    expect(nextClassicIn(10)).toBe(10); // 刚解锁第 1 篇，距第 2 篇还需 10 首
    expect(nextClassicIn(12)).toBe(8);
  });

  it('CLASSICS_PER_TEN = 10', () => {
    expect(CLASSICS_PER_TEN).toBe(10);
  });
});
