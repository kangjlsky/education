/* =========================================================
   数据备份（纯函数，无 DOM 依赖，可测试）
   buildBackup 生成含版本号的 JSON；parseBackup 校验后还原
   ========================================================= */

export const BACKUP_VERSION = 1;

/** 生成备份 JSON 字符串（含版本与导出时间） */
export function buildBackup(data) {
  return JSON.stringify({
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...(data || {}),
  });
}

/**
 * 解析备份 JSON
 * @returns {{ok:true, data:Object} | {ok:false, reason:'invalid'}}
 */
export function parseBackup(json) {
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj.version !== BACKUP_VERSION) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, data: obj };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/**
 * 备份数据字段校验（纯函数，可测试）
 * @returns {{ok:true} | {ok:false, reason:'invalid'}}
 */
export function validateBackupData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'invalid' };
  if (!Array.isArray(data.logs) || !Number.isFinite(Number(data.score))) return { ok: false, reason: 'invalid' };
  for (const key of ['settings', 'config', 'medals', 'weekPlan']) {
    if (data[key] != null && (typeof data[key] !== 'object' || Array.isArray(data[key]))) {
      return { ok: false, reason: 'invalid' };
    }
  }
  return { ok: true };
}
