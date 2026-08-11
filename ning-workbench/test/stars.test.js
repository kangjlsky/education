import { describe, it, expect } from 'vitest';
import { CHECKIN_EARNED, hasCheckin, addCheckin } from '../js/core/stars.js';

describe('积分引擎与打卡去重', () => {
  const ts = 1_720_000_000_000;

  it('首次打卡：ok，星光 +1，记录含日期/板块/任务项/时间戳/获得星光', () => {
    const r = addCheckin([], 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    expect(r.ok).toBe(true);
    expect(r.reason).toBeUndefined();
    expect(r.stars).toBe(1);
    expect(r.logs).toHaveLength(1);
    expect(r.logs[0]).toEqual({ date: '2026-08-11', subject: 'poems', item: 'poem_001', ts, earned: CHECKIN_EARNED });
  });

  it('同日同一任务重复打卡：拒绝且不重复加分', () => {
    const first = addCheckin([], 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    const r = addCheckin(first.logs, first.stars, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts: ts + 10 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('duplicate');
    expect(r.stars).toBe(1);
    expect(r.logs).toHaveLength(1);
  });

  it('同日不同任务：各自 +1', () => {
    const a = addCheckin([], 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    const b = addCheckin(a.logs, a.stars, { date: '2026-08-11', subject: 'poems', item: 'poem_002', ts });
    expect(b.ok).toBe(true);
    expect(b.stars).toBe(2);
    expect(b.logs).toHaveLength(2);
  });

  it('不同日期同一任务：每天可重新打卡', () => {
    const a = addCheckin([], 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    const b = addCheckin(a.logs, a.stars, { date: '2026-08-12', subject: 'poems', item: 'poem_001', ts });
    expect(b.ok).toBe(true);
    expect(b.stars).toBe(2);
  });

  it('同一天跨板块同一任务标识：互不影响', () => {
    const a = addCheckin([], 0, { date: '2026-08-11', subject: 'words', item: 'poem_001', ts });
    const b = addCheckin(a.logs, a.stars, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    expect(b.ok).toBe(true);
    expect(b.stars).toBe(2);
  });

  it('hasCheckin：正确判断是否已打卡', () => {
    const a = addCheckin([], 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    expect(hasCheckin(a.logs, '2026-08-11', 'poems', 'poem_001')).toBe(true);
    expect(hasCheckin(a.logs, '2026-08-11', 'poems', 'poem_002')).toBe(false);
    expect(hasCheckin(a.logs, '2026-08-12', 'poems', 'poem_001')).toBe(false);
  });

  it('空记录数组作为输入不报错', () => {
    expect(() => addCheckin(null, 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts })).not.toThrow();
    expect(hasCheckin(null, '2026-08-11', 'poems', 'poem_001')).toBe(false);
  });

  it('非数组日志（损坏数据）不抛错，视为空记录', () => {
    expect(() => addCheckin({ bad: true }, 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts })).not.toThrow();
    const r = addCheckin({ bad: true }, 0, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts });
    expect(r.ok).toBe(true);
    expect(hasCheckin({ bad: true }, '2026-08-11', 'poems', 'poem_001')).toBe(false);
  });

  it('日志数组内含 null 元素不抛错', () => {
    const logs = [null, { date: '2026-08-11', subject: 'poems', item: 'poem_001', ts, earned: 1 }];
    expect(() => hasCheckin(logs, '2026-08-11', 'poems', 'poem_002')).not.toThrow();
    expect(hasCheckin(logs, '2026-08-11', 'poems', 'poem_001')).toBe(true);
    expect(hasCheckin(logs, '2026-08-11', 'poems', 'poem_002')).toBe(false);
  });
});
