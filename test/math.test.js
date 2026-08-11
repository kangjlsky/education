import { describe, it, expect } from 'vitest';
import {
  QUIZ_PER_ROUND,
  currentStage,
  isStageUnlocked,
  gameStage,
  makeCountQuestion,
  makeCompareQuestion,
} from '../js/core/math.js';

describe('数学领域逻辑', () => {
  describe('阶段推进（currentStage/isStageUnlocked）', () => {
    it('未完成任何游戏：当前阶段为 1', () => {
      expect(currentStage({})).toBe(1);
      expect(currentStage(null)).toBe(1);
    });
    it('阶段 1 全部完成：当前阶段推进到 2', () => {
      expect(currentStage({ 1: ['count'] })).toBe(2);
    });
    it('阶段 1-2 全部完成：返回 null（无可玩阶段）', () => {
      expect(currentStage({ 1: ['count'], 2: ['compare'] })).toBe(null);
    });
    it('阶段 1 只完成部分游戏：仍停留在阶段 1', () => {
      expect(currentStage({ 1: ['other'] })).toBe(1);
    });
    it('isStageUnlocked：阶段 ≤ 当前可解锁', () => {
      expect(isStageUnlocked(1, {})).toBe(true);
      expect(isStageUnlocked(2, {})).toBe(false);
      expect(isStageUnlocked(2, { 1: ['count'] })).toBe(true);
      expect(isStageUnlocked(3, { 1: ['count'] })).toBe(false);
    });
    it('isStageUnlocked：全部完成后阶段皆解锁', () => {
      expect(isStageUnlocked(6, { 1: ['count'], 2: ['compare'] })).toBe(true);
    });
  });

  describe('gameStage（游戏所属阶段）', () => {
    it('count → 1，compare → 2，未知 → null', () => {
      expect(gameStage('count')).toBe(1);
      expect(gameStage('compare')).toBe(2);
      expect(gameStage('unknown')).toBe(null);
    });
  });

  describe('makeCountQuestion（数一数）', () => {
    it('答案 1-10，emoji 数量与答案一致', () => {
      const q = makeCountQuestion();
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(10);
      expect([...q.emojis].length).toBe(q.answer); // 按码点计数（emoji 为代理对）
    });
    it('4 个唯一选项且含正确答案', () => {
      const q = makeCountQuestion(() => 0.42);
      expect(q.options).toHaveLength(4);
      expect(q.options.includes(q.answer)).toBe(true);
      expect(new Set(q.options).size).toBe(4);
    });
  });

  describe('makeCompareQuestion（比大小）', () => {
    it('左右数量不同（1-8），answer 指向多的一侧', () => {
      const q = makeCompareQuestion();
      expect(q.leftCount).not.toBe(q.rightCount);
      expect(q.leftCount).toBeGreaterThanOrEqual(1);
      expect(q.rightCount).toBeLessThanOrEqual(8);
      expect(q.answer).toBe(q.leftCount > q.rightCount ? 'left' : 'right');
      expect(q.options).toEqual(['left', 'right']);
    });
  });

  it('QUIZ_PER_ROUND = 3', () => {
    expect(QUIZ_PER_ROUND).toBe(3);
  });
});
