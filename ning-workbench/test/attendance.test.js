import { describe, it, expect } from 'vitest';
import { WEEK_BONUS, MIN_DAYS, weekDays, isFullWeek, settleWeek, pendingWeeks } from '../js/core/attendance.js';

describe('全勤结算', () => {
  const wk = { start: '2026-08-10', end: '2026-08-16' };

  const oneDay = (date, item = 'poem_001') => ({ date, subject: 'poems', item, ts: 0, earned: 1 });

  it('weekDays：一周内 5 个不同日期计 5 天', () => {
    const logs = [
      oneDay('2026-08-10'),
      oneDay('2026-08-11'),
      oneDay('2026-08-12'),
      oneDay('2026-08-13'),
      oneDay('2026-08-14'),
    ];
    expect(weekDays(logs, wk.start, wk.end)).toBe(5);
  });

  it('weekDays：同一天多条打卡只计 1 天', () => {
    const logs = [
      oneDay('2026-08-10'),
      oneDay('2026-08-10', 'poem_002'),
      oneDay('2026-08-11'),
      oneDay('2026-08-12'),
      oneDay('2026-08-13'),
    ];
    expect(weekDays(logs, wk.start, wk.end)).toBe(4);
  });

  it('weekDays：区间外记录不计入', () => {
    const logs = [oneDay('2026-08-09'), oneDay('2026-08-17'), oneDay('2026-08-10')];
    expect(weekDays(logs, wk.start, wk.end)).toBe(1);
  });

  it('isFullWeek：满 5 天为全勤', () => {
    const logs = ['10', '11', '12', '13', '14'].map((d) => oneDay(`2026-08-${d}`));
    expect(isFullWeek(logs, wk.start, wk.end)).toBe(true);
    expect(isFullWeek(logs.slice(0, 4), wk.start, wk.end)).toBe(false);
  });

  it('settleWeek：满勤 +3 星光，不满勤不变', () => {
    const full = ['10', '11', '12', '13', '14'].map((d) => oneDay(`2026-08-${d}`));
    expect(settleWeek(full, 10, wk.start, wk.end)).toBe(13);
    const partial = full.slice(0, 4);
    expect(settleWeek(partial, 10, wk.start, wk.end)).toBe(10);
  });

  it('损坏/空日志不抛错', () => {
    expect(weekDays(null, wk.start, wk.end)).toBe(0);
    expect(weekDays({ bad: true }, wk.start, wk.end)).toBe(0);
    expect(weekDays([null, oneDay('2026-08-10')], wk.start, wk.end)).toBe(1);
    expect(settleWeek({ bad: true }, 5, wk.start, wk.end)).toBe(5);
  });

  it('常量：WEEK_BONUS=3, MIN_DAYS=5', () => {
    expect(WEEK_BONUS).toBe(3);
    expect(MIN_DAYS).toBe(5);
  });

  it('pendingWeeks：首次使用只结算上一周', () => {
    expect(pendingWeeks(null, '2026-08-10')).toEqual(['2026-08-10']);
  });

  it('pendingWeeks：已结算当周则无待结算', () => {
    expect(pendingWeeks('2026-08-10', '2026-08-10')).toEqual([]);
  });

  it('pendingWeeks：连续多周未打开则补结算中间所有周', () => {
    expect(pendingWeeks('2026-07-27', '2026-08-10')).toEqual(['2026-08-03', '2026-08-10']);
    expect(pendingWeeks('2026-07-20', '2026-08-10')).toEqual(['2026-07-27', '2026-08-03', '2026-08-10']);
  });

  it('pendingWeeks：已结算周晚于目标周则返回空', () => {
    expect(pendingWeeks('2026-08-17', '2026-08-10')).toEqual([]);
  });
});
