import { describe, it, expect } from 'vitest';
import { LEVEL_EVERY, petLevel, nextLevelIn, levelProgress, newLevels } from '../js/core/pet.js';

describe('宠物等级逻辑', () => {
  it('petLevel：每 10 星光升 1 级，向下取整', () => {
    expect(petLevel(0)).toBe(0);
    expect(petLevel(9)).toBe(0);
    expect(petLevel(10)).toBe(1);
    expect(petLevel(25)).toBe(2);
  });

  it('petLevel：负值/非数字防御', () => {
    expect(petLevel(-5)).toBe(0);
    expect(petLevel(null)).toBe(0);
    expect(petLevel('abc')).toBe(0);
  });

  it('nextLevelIn：距下一级所需星光', () => {
    expect(nextLevelIn(0)).toBe(10);
    expect(nextLevelIn(5)).toBe(5);
    expect(nextLevelIn(10)).toBe(10);
    expect(nextLevelIn(19)).toBe(1);
  });

  it('levelProgress：当前级进度（0-1）', () => {
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(5)).toBeCloseTo(0.5);
    expect(levelProgress(10)).toBe(0);
    expect(levelProgress(15)).toBeCloseTo(0.5);
  });

  it('newLevels：跨过 10 的倍数时的新等级数', () => {
    expect(newLevels(9, 10)).toBe(1);
    expect(newLevels(19, 20)).toBe(1);
    expect(newLevels(9, 15)).toBe(1);
    expect(newLevels(10, 15)).toBe(0);
    expect(newLevels(9, 25)).toBe(2);
  });

  it('LEVEL_EVERY = 10', () => {
    expect(LEVEL_EVERY).toBe(10);
  });
});
