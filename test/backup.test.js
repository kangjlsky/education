import { describe, it, expect } from 'vitest';
import { BACKUP_VERSION, buildBackup, parseBackup, validateBackupData } from '../js/core/backup.js';

describe('数据备份', () => {
  const sample = {
    logs: [{ date: '2026-08-10', subject: 'poems', item: 'poem_001', ts: 1, earned: 1 }],
    score: 5,
    medals: { redeemed: 0, history: [] },
  };

  it('buildBackup：包含版本与导出时间', () => {
    const json = buildBackup(sample);
    const obj = JSON.parse(json);
    expect(obj.version).toBe(BACKUP_VERSION);
    expect(typeof obj.exportedAt).toBe('string');
    expect(obj.logs).toHaveLength(1);
    expect(obj.score).toBe(5);
  });

  it('parseBackup：合法备份解析成功', () => {
    const r = parseBackup(buildBackup(sample));
    expect(r.ok).toBe(true);
    expect(r.data.score).toBe(5);
    expect(r.data.logs[0].item).toBe('poem_001');
  });

  it('parseBackup：损坏 JSON 拒绝', () => {
    expect(parseBackup('not json{').ok).toBe(false);
    expect(parseBackup(null).ok).toBe(false);
  });

  it('parseBackup：版本不符拒绝', () => {
    expect(parseBackup(JSON.stringify({ version: 999, score: 1 })).ok).toBe(false);
  });

  it('parseBackup：非对象拒绝', () => {
    expect(parseBackup(JSON.stringify('hello')).ok).toBe(false);
  });

  describe('validateBackupData（字段校验）', () => {
    const good = { logs: [], score: 0, settings: {}, medals: {}, weekPlan: {} };
    it('合法数据通过', () => {
      expect(validateBackupData(good).ok).toBe(true);
      expect(validateBackupData({ logs: [], score: 5 }).ok).toBe(true);
    });
    it('logs 非数组 / score 非数字拒绝', () => {
      expect(validateBackupData({ logs: 'x', score: 0 }).ok).toBe(false);
      expect(validateBackupData({ logs: [], score: 'abc' }).ok).toBe(false);
    });
    it('对象字段类型错误拒绝', () => {
      expect(validateBackupData({ logs: [], score: 0, settings: 'bad' }).ok).toBe(false);
      expect(validateBackupData({ logs: [], score: 0, medals: [1] }).ok).toBe(false);
      expect(validateBackupData({ logs: [], score: 0, weekPlan: 3 }).ok).toBe(false);
    });
    it('null/非对象拒绝', () => {
      expect(validateBackupData(null).ok).toBe(false);
      expect(validateBackupData([1, 2]).ok).toBe(false);
    });
  });
});
