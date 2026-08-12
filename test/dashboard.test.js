import { describe, it, expect } from 'vitest';
import { addDays } from '../js/core/dates.js';
import {
  monthDays,
  last7Days,
  subjectProgress,
  fullWeeksInMonth,
  buildDailyReport,
} from '../js/core/dashboard.js';

describe('看板聚合', () => {
  const ts = 1_720_000_000_000;
  const mk = (subject, item, date) => ({ subject, item, date, ts, earned: 1 });

  describe('monthDays（月打卡日）', () => {
    it('返回该月打卡日期集合（同天多条只记一天）', () => {
      const logs = [
        mk('poems', 'p1', '2026-08-10'),
        mk('poems', 'p2', '2026-08-10'),
        mk('words', 'w1', '2026-08-11'),
        mk('math', 'count', '2026-09-01'),
      ];
      const days = monthDays(logs, 2026, 8);
      expect(days).toEqual(new Set(['2026-08-10', '2026-08-11']));
    });
    it('空/损坏日志防御', () => {
      expect(monthDays(null, 2026, 8)).toEqual(new Set());
      expect(monthDays([null], 2026, 8)).toEqual(new Set());
    });
  });

  describe('fullWeeksInMonth（月内全勤周）', () => {
    it('找出打卡满 5 天的周（周一为起点）', () => {
      const logs = [];
      // 2026-08-03（周一）起连续 5 天
      for (let i = 0; i < 5; i += 1) {
        logs.push(mk('poems', `p${i}`, addDays('2026-08-03', i)));
      }
      // 2026-08-10 起只有 3 天
      for (let i = 0; i < 3; i += 1) {
        logs.push(mk('words', `w${i}`, addDays('2026-08-10', i)));
      }
      const full = fullWeeksInMonth(logs, 2026, 8);
      expect(full).toContain('2026-08-03');
      expect(full).not.toContain('2026-08-10');
    });

    it('月初跨月周（起点在上月、当月内 ≥5 天）满勤也标记', () => {
      // 2026-09-01 是周二，该周起点 8/31（8 月），9/1-9/5 在 9 月内满 5 天
      const logs = [];
      for (let i = 0; i < 5; i += 1) {
        logs.push(mk('poems', `p${i}`, addDays('2026-09-01', i)));
      }
      const full = fullWeeksInMonth(logs, 2026, 9);
      expect(full).toContain('2026-08-31');
    });

    it('月初是周一且满勤：全勤周不重复', () => {
      // 2026-06-01 是周一
      const logs = [];
      for (let i = 0; i < 5; i += 1) {
        logs.push(mk('poems', `p${i}`, addDays('2026-06-01', i)));
      }
      const full = fullWeeksInMonth(logs, 2026, 6);
      expect(full).toEqual(['2026-06-01']);
    });
  });

  describe('last7Days（近 7 天打卡数）', () => {
    it('返回近 7 天每天打卡次数（含无打卡日）', () => {
      const logs = [mk('poems', 'p1', '2026-08-10'), mk('words', 'w1', '2026-08-10')];
      const bars = last7Days(logs, '2026-08-12');
      expect(bars).toHaveLength(7);
      expect(bars[6]).toEqual({ date: '2026-08-12', count: 0 });
      expect(bars[4]).toEqual({ date: '2026-08-10', count: 2 });
    });
  });

  describe('subjectProgress（各科进度）', () => {
    it('统计已学去重数与总量', () => {
      const logs = [
        mk('poems', 'p1', '2026-08-10'),
        mk('poems', 'p2', '2026-08-11'),
        mk('poems', 'p1', '2026-08-12'),
      ];
      expect(subjectProgress(logs, 'poems', 100)).toEqual({ done: 2, total: 100 });
    });
    it('科目无记录为 0', () => {
      expect(subjectProgress([], 'english', 30)).toEqual({ done: 0, total: 30 });
    });
  });

  describe('buildDailyReport（每日报告）', () => {
    it('无打卡日：总结为未打卡', () => {
      const r = buildDailyReport([], 5, { redeemed: 0, history: [] }, '2026-08-10');
      expect(r.count).toBe(0);
      expect(r.subjects).toEqual([]);
      expect(r.summary).toContain('还没有学习');
    });

    it('有打卡日：科目去重 + 星光增量 + 总结', () => {
      const logs = [
        mk('poems', 'p1', '2026-08-10'),
        mk('words', 'w1', '2026-08-10'),
        mk('math', 'count', '2026-08-10'),
      ];
      const r = buildDailyReport(logs, 10, { redeemed: 0, history: [] }, '2026-08-10');
      expect(r.count).toBe(3);
      expect(r.subjects.sort()).toEqual(['math', 'poems', 'words']);
      expect(r.starsEarned).toBe(3);
      expect(r.summary).toContain('3 项打卡');
    });

    it('勋章变化：统计今日获得勋章', () => {
      const medals = {
        redeemed: 0,
        history: [
          { date: '2026-08-10', type: 'earn', n: 1, stars: 5 },
          { date: '2026-08-09', type: 'earn', n: 2, stars: 10 },
        ],
      };
      const r = buildDailyReport([], 5, medals, '2026-08-10');
      expect(r.medalsEarned).toBe(1);
    });

    it('明日预告：返回明天日期', () => {
      const r = buildDailyReport([], 0, { redeemed: 0, history: [] }, '2026-08-10');
      expect(r.tomorrow).toBe('2026-08-11');
    });
  });
});
