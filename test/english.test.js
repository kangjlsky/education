import { describe, it, expect } from 'vitest';
import { booksDone, booksDoneToday, englishLearnedMap, isBookItem } from '../js/core/english.js';

describe('英语领域逻辑', () => {
  const ts = 1_720_000_000_000;
  const mk = (subject, item, date) => ({ subject, item, date, ts, earned: 1 });

  describe('englishLearnedMap（英语单词已学推导）', () => {
    it('收集 subject=english 且非绘本的打卡为单词已学（首次日期）', () => {
      const logs = [
        mk('english', 'ew001', '2026-08-10'),
        mk('english', 'ew002', '2026-08-11'),
        mk('english', 'ew001', '2026-08-12'), // 重复：保留首次日期
      ];
      const map = englishLearnedMap(logs);
      expect(map).toEqual({ ew001: '2026-08-10', ew002: '2026-08-11' });
    });

    it('忽略绘本 item（ebook_ 前缀）与其他科目', () => {
      const logs = [
        mk('english', 'eb001', '2026-08-10'),
        mk('poems', 'poem_001', '2026-08-10'),
        mk('words', 'w001', '2026-08-10'),
      ];
      expect(englishLearnedMap(logs)).toEqual({});
    });

    it('损坏/空日志防御', () => {
      expect(englishLearnedMap(null)).toEqual({});
      expect(englishLearnedMap([null, mk('english', 'ew001', '2026-08-10')])).toEqual({ ew001: '2026-08-10' });
    });
  });

  describe('isBookItem（绘本标识判断）', () => {
    it('ebook_ 前缀为绘本，其余为单词', () => {
      expect(isBookItem('eb001')).toBe(true);
      expect(isBookItem('ebook_001')).toBe(true);
      expect(isBookItem('ew001')).toBe(false);
    });
  });

  describe('booksDone（历史已读绘本）', () => {
    it('返回全部已读绘本 id（跨天去重）', () => {
      const logs = [
        mk('english', 'eb001', '2026-08-10'),
        mk('english', 'eb002', '2026-08-11'),
        mk('english', 'eb001', '2026-08-12'),
      ];
      expect(booksDone(logs).sort()).toEqual(['eb001', 'eb002']);
    });

    it('损坏输入防御', () => {
      expect(booksDone(null)).toEqual([]);
    });
  });

  describe('booksDoneToday（今日已打卡绘本）', () => {
    it('返回今日绘本打卡 id 列表（去重）', () => {
      const logs = [
        mk('english', 'eb001', '2026-08-10'),
        mk('english', 'eb002', '2026-08-10'),
        mk('english', 'eb001', '2026-08-10'), // 重复
        mk('english', 'eb003', '2026-08-09'),
      ];
      expect(booksDoneToday(logs, '2026-08-10').sort()).toEqual(['eb001', 'eb002']);
    });

    it('非绘本/其他日期不计入', () => {
      const logs = [mk('english', 'ew001', '2026-08-10'), mk('poems', 'poem_001', '2026-08-10')];
      expect(booksDoneToday(logs, '2026-08-10')).toEqual([]);
    });

    it('损坏输入防御', () => {
      expect(booksDoneToday(null, '2026-08-10')).toEqual([]);
    });
  });
});
