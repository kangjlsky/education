import { describe, it, expect } from 'vitest';
import { toDateStr, addDays, mondayOf } from '../js/core/dates.js';

describe('周日期工具', () => {
  it('toDateStr：Date 转本地日期字符串 YYYY-MM-DD', () => {
    expect(toDateStr(new Date(2026, 7, 11))).toBe('2026-08-11');
    expect(toDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('addDays：同月加减', () => {
    expect(addDays('2026-08-11', 1)).toBe('2026-08-12');
    expect(addDays('2026-08-11', -1)).toBe('2026-08-10');
  });

  it('addDays：跨月', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('addDays：跨年', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('mondayOf：返回日期所在周的周一', () => {
    expect(mondayOf('2026-08-10')).toBe('2026-08-10'); // 本身就是周一
    expect(mondayOf('2026-08-11')).toBe('2026-08-10'); // 周二
    expect(mondayOf('2026-08-16')).toBe('2026-08-10'); // 周日
    expect(mondayOf('2026-08-09')).toBe('2026-08-03'); // 上上周日跨周
  });
});
