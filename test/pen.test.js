import { describe, it, expect } from 'vitest';
import { COVERAGE_TARGET, coverage, isComplete, addSegmentToSet } from '../js/core/pen.js';

describe('描红判定', () => {
  const key = (x, y) => `${x},${y}`;
  const shape = new Set([key(0, 0), key(0, 1), key(0, 2), key(1, 0), key(1, 1)]); // 5 个字形像素

  it('coverage：完全未覆盖为 0', () => {
    expect(coverage(shape, new Set())).toBe(0);
    expect(coverage(shape, new Set([key(9, 9)]))).toBe(0);
  });

  it('coverage：部分覆盖按比例计算', () => {
    const drawn = new Set([key(0, 0), key(0, 1)]); // 2/5
    expect(coverage(shape, drawn)).toBeCloseTo(0.4);
  });

  it('coverage：完全覆盖为 1', () => {
    expect(coverage(shape, new Set([...shape]))).toBe(1);
    // 超出字形范围的笔迹不影响覆盖率
    const drawn = new Set([...shape, key(9, 9)]);
    expect(coverage(shape, drawn)).toBe(1);
  });

  it('coverage：空字形返回 0 且不抛错', () => {
    expect(coverage(new Set(), new Set([key(0, 0)]))).toBe(0);
  });

  it('isComplete：达到阈值判定完成（默认 80%）', () => {
    const ok = new Set([key(0, 0), key(0, 1), key(0, 2), key(1, 0)]); // 4/5 = 0.8
    expect(isComplete(shape, ok)).toBe(true);
    const almost = new Set([key(0, 0), key(0, 1), key(0, 2)]); // 3/5 = 0.6
    expect(isComplete(shape, almost)).toBe(false);
  });

  it('isComplete：支持自定义阈值', () => {
    const half = new Set([key(0, 0), key(0, 1), key(0, 2)]); // 0.6
    expect(isComplete(shape, half, 0.5)).toBe(true);
    expect(isComplete(shape, half, 0.7)).toBe(false);
  });

  it('COVERAGE_TARGET = 0.8', () => {
    expect(COVERAGE_TARGET).toBe(0.8);
  });

  describe('addSegmentToSet（线段插值采样 + 偶化对齐网格）', () => {
    it('采样点全部落在偶网格（与字形提取网格同相位）', () => {
      const set = new Set();
      addSegmentToSet(set, 141, 0, 141, 300); // 奇数列竖线
      for (const k of set) {
        const x = Number(k.split(',')[0]);
        expect(x % 2).toBe(0);
      }
      expect(set.size).toBeGreaterThan(10);
    });

    it('集成：奇数列竖线（视觉描满）判定通过', () => {
      // 模拟字形：偶网格上的 2 列竖条（x=140/142，y 0-80）
      const shape = new Set();
      for (let y = 0; y <= 80; y += 2) {
        shape.add(`140,${y}`);
        shape.add(`142,${y}`);
      }
      // 手指在奇数列 x=141 竖着描：偶化后覆盖 140 列
      const drawn = new Set();
      addSegmentToSet(drawn, 141, 0, 141, 80);
      // 线宽语义下再补一列模拟相邻覆盖
      addSegmentToSet(drawn, 143, 0, 143, 80);
      expect(isComplete(shape, drawn)).toBe(true);
    });

    it('自定义步长', () => {
      const set = new Set();
      addSegmentToSet(set, 0, 0, 100, 0, 10);
      expect(set.size).toBeGreaterThanOrEqual(10);
    });
  });
});
