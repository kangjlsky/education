import { describe, it, expect } from 'vitest';
import {
  QUIZ_PER_ROUND,
  currentStage,
  isStageUnlocked,
  gameStage,
  makeCountQuestion,
  makeCompareQuestion,
  makeShapeFindQuestion,
  makeShapeCountQuestion,
  makeAddQuestion,
  makeSubQuestion,
  makeMixArithQuestion,
  makeClockQuestion,
  makeMoneyValueQuestion,
  makeMoneyShopQuestion,
  CLOCK_HOUR_EMOJIS,
  CLOCK_HALF_EMOJIS,
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
    it('阶段 1-2 完成：推进到阶段 3（阶段 3-6 已有游戏）', () => {
      expect(currentStage({ 1: ['count'], 2: ['compare'] })).toBe(3);
    });
    it('全部游戏阶段完成：返回 null（无可玩阶段）', () => {
      const done = {
        1: ['count'],
        2: ['compare'],
        3: ['shape_find', 'shape_count'],
        4: ['add10', 'sub10', 'mix20'],
        5: ['clock_hour', 'clock_half'],
        6: ['money_value', 'money_shop'],
      };
      expect(currentStage(done)).toBe(null);
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
    it('isStageUnlocked：全部游戏阶段完成后阶段皆解锁', () => {
      const done = {
        1: ['count'],
        2: ['compare'],
        3: ['shape_find', 'shape_count'],
        4: ['add10', 'sub10', 'mix20'],
        5: ['clock_hour', 'clock_half'],
        6: ['money_value', 'money_shop'],
      };
      expect(isStageUnlocked(6, done)).toBe(true);
      expect(isStageUnlocked(6, { 1: ['count'], 2: ['compare'] })).toBe(false);
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

  describe('阶段 3-6 出题', () => {
    it('makeShapeFindQuestion：4 个唯一图形选项含目标，answer = 目标', () => {
      const q = makeShapeFindQuestion(() => 0.3);
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.target);
      expect(q.answer).toBe(q.target); // renderPlay 统一用 q.answer 判定
      expect(new Set(q.options).size).toBe(4);
    });

    it('makeShapeCountQuestion：图形串中目标个数 = 答案（选项含答案）', () => {
      const q = makeShapeCountQuestion(() => 0.5);
      expect([...q.emojis].filter((e) => e === q.target).length).toBe(q.answer);
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(4);
      expect(q.options).toContain(q.answer);
    });

    it('makeAddQuestion：和 ≤ max，选项含答案', () => {
      const q = makeAddQuestion(10, () => 0.4);
      expect(q.a + q.b).toBe(q.answer);
      expect(q.answer).toBeLessThanOrEqual(10);
      expect(q.options).toContain(q.answer);
      expect(q.options).toHaveLength(4);
    });

    it('makeSubQuestion：差 ≥ 0，选项含答案', () => {
      const q = makeSubQuestion(10, () => 0.7);
      expect(q.a - q.b).toBe(q.answer);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.options).toContain(q.answer);
    });

    it('makeMixArithQuestion：加/减混合，结果正确', () => {
      const q = makeMixArithQuestion(20, () => 0.8);
      expect(q.answer).toBe(q.op === '+' ? q.a + q.b : q.a - q.b);
      expect(q.options).toContain(q.answer);
    });

    it('makeClockQuestion：整点/半点 emoji 与答案一致', () => {
      const h = makeClockQuestion(false, () => 0.5);
      expect(h.half).toBe(false);
      expect(h.answer).toBe(`${h.hour} 点`);
      expect(h.options).toContain(`${h.hour} 点`);
      expect(CLOCK_HOUR_EMOJIS[h.hour]).toBe(h.emoji);
      const half = makeClockQuestion(true, () => 0.5);
      expect(half.answer).toBe(`${half.hour} 点半`);
      expect(CLOCK_HALF_EMOJIS[half.hour]).toBe(half.emoji);
    });

    it('makeMoneyValueQuestion：显示面值文字，选项含答案', () => {
      const q = makeMoneyValueQuestion(() => 0.6);
      expect(q.text).toBe(`${q.answer} 元`);
      expect(q.options).toContain(q.answer);
      expect(q.options).toHaveLength(4);
    });

    it('makeMoneyShopQuestion：商品价格 = 答案', () => {
      const q = makeMoneyShopQuestion(() => 0.2);
      expect(q.price).toBe(q.answer);
      expect(q.ico).toBeTruthy();
      expect(q.options).toContain(q.answer);
      expect(q.options).toHaveLength(4);
    });
  });
});
