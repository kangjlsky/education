/* =========================================================
   积分引擎与打卡去重（纯函数，无 DOM 依赖，可测试）
   规则：任意板块完成一次打卡 +1 星光；
   同一天同一板块同一任务项不可重复领星光（每天重置）
   ========================================================= */

export const CHECKIN_EARNED = 1;

/** 是否已打过卡（同一天同一板块同一任务项） */
export function hasCheckin(logs, date, subject, item) {
  return (Array.isArray(logs) ? logs : []).some(
    (l) => l && l.date === date && l.subject === subject && l.item === item
  );
}

/**
 * 添加一条打卡记录（纯函数，返回新状态，不修改入参）
 * @param {Array}  logs  现有打卡记录
 * @param {number} stars 当前星光
 * @param {{date:string, subject:string, item:string, ts:number}} checkin 打卡信息
 * @returns {{ok:boolean, reason?:string, stars:number, logs:Array}}
 */
export function addCheckin(logs, stars, { date, subject, item, ts }) {
  const list = Array.isArray(logs) ? logs : [];
  if (hasCheckin(list, date, subject, item)) {
    return { ok: false, reason: 'duplicate', stars, logs: list };
  }
  const entry = { date, subject, item, ts, earned: CHECKIN_EARNED };
  return { ok: true, stars: stars + CHECKIN_EARNED, logs: [...list, entry] };
}
