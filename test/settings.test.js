import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, normalizeConfig } from '../js/core/settings.js';

describe('家长设置', () => {
  it('默认配置：周任务量/兑换档位/昵称/宠物主题', () => {
    expect(DEFAULT_CONFIG.weekly).toEqual({ poems: 3, words: 10, books: 3, penDaily: 2 });
    expect(DEFAULT_CONFIG.redeem).toHaveLength(3);
    expect(DEFAULT_CONFIG.childName).toBe('柠柠');
  });

  it('normalizeConfig：null/脏数据返回默认副本', () => {
    const c = normalizeConfig(null);
    expect(c.weekly.poems).toBe(3);
    expect(c.childName).toBe('柠柠');
    expect(c).not.toBe(DEFAULT_CONFIG); // 深拷贝，不共享引用
  });

  it('normalizeConfig：补齐缺失字段', () => {
    const c = normalizeConfig({ childName: '宝宝' });
    expect(c.childName).toBe('宝宝');
    expect(c.weekly.poems).toBe(3);
    expect(c.redeem).toHaveLength(3);
  });

  it('normalizeConfig：数值钳制到 1-50', () => {
    const c = normalizeConfig({ weekly: { poems: 0, words: 999, books: 5 } });
    expect(c.weekly.poems).toBe(3); // 非法回退默认
    expect(c.weekly.words).toBe(10); // 非法回退默认
    expect(c.weekly.books).toBe(5);  // 合法保留
  });

  it('normalizeConfig：兑换档位规范化', () => {
    const c = normalizeConfig({ redeem: [{ medals: '2', reward: '糖果' }, { medals: 7, reward: '公园' }] });
    expect(c.redeem).toEqual([
      { medals: 2, reward: '糖果' },
      { medals: 7, reward: '公园' },
    ]);
  });

  it('normalizeConfig：宠物主题保留字符串', () => {
    expect(normalizeConfig({ petTheme: 'cat' }).petTheme).toBe('cat');
    expect(normalizeConfig({ petTheme: 123 }).petTheme).toBe('dino'); // 非字符串回退
  });
});
