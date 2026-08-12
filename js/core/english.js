/* =========================================================
   英语领域逻辑（纯函数，无 DOM 依赖，可测试）
   - 单词/绘本打卡记录推导（logs → 进度）
   ========================================================= */

/** 绘本 item 前缀（区别于单词） */
export const BOOK_PREFIX = 'eb';

/** item 是否为绘本（ebook_ 或 eb 前缀） */
export function isBookItem(item) {
  return typeof item === 'string' && (item.startsWith('ebook_') || item.startsWith(BOOK_PREFIX));
}

/** 从打卡记录推导英语单词已学映射：{ id: 首次学习日期 }（排除绘本） */
export function englishLearnedMap(logs) {
  const map = {};
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.subject === 'english' && l.item && !isBookItem(l.item) && !(l.item in map)) {
      map[l.item] = l.date;
    }
  }
  return map;
}

/** 今日已打卡绘本 id 列表（去重） */
export function booksDoneToday(logs, today) {
  const done = [];
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.subject === 'english' && isBookItem(l.item) && l.date === today && !done.includes(l.item)) {
      done.push(l.item);
    }
  }
  return done;
}

/** 历史已读绘本 id 列表（去重） */
export function booksDone(logs) {
  const done = [];
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.subject === 'english' && isBookItem(l.item) && !done.includes(l.item)) {
      done.push(l.item);
    }
  }
  return done;
}
