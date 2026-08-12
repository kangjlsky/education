/* =========================================================
   控笔描红判定（纯函数，无 DOM 依赖，可测试）
   规则：孩子笔迹覆盖字形像素 ≥80% 判定完成
   像素 key 格式 "x,y"，坐标均为整数
   ========================================================= */

export const COVERAGE_TARGET = 0.8;

/**
 * 覆盖率：笔迹像素集覆盖字形像素集的比例（0-1）
 * @param {Set<string>} shapeSet 字形像素（key 如 "x,y"）
 * @param {Set<string>} drawnSet 笔迹像素
 */
export function coverage(shapeSet, drawnSet) {
  if (!shapeSet || !shapeSet.size) return 0;
  let hit = 0;
  for (const p of shapeSet) {
    if (drawnSet.has(p)) hit += 1;
  }
  return hit / shapeSet.size;
}

/** 是否达到完成阈值（默认 80%） */
export function isComplete(shapeSet, drawnSet, target = COVERAGE_TARGET) {
  return coverage(shapeSet, drawnSet) >= target;
}

/**
 * 线段插值采样写入笔迹集合（纯函数，可测试）
 * 采样点偶化（& ~1）对齐字形提取网格，保证判定相位一致
 * @param {Set<string>} set 笔迹像素集合（原地写入）
 * @param {number} x0,y0,x1,y1 线段端点
 * @param {number} step 采样步长（默认 2，与字形网格一致）
 */
export function addSegmentToSet(set, x0, y0, x1, y1, step = 2) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  const steps = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const px = Math.round(x0 + dx * t) & ~1; // 偶化：与字形网格同相位
    const py = Math.round(y0 + dy * t) & ~1;
    set.add(`${px},${py}`);
  }
  return set;
}
