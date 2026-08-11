/* =========================================================
   勋章屋板块：已获勋章数 + 下一枚进度 + 获得历史
   ctx 注入：getStars / getMedals / go
   历史记录来自本地存储，用 textContent 构建防注入
   ========================================================= */

import { MEDAL_EVERY, medalsAvailable, medalsEarned } from '../core/medals.js';

export function renderMedals(container, ctx) {
  const stars = ctx.getStars();
  const m = ctx.getMedals() || { redeemed: 0, history: [] };
  const avail = medalsAvailable(stars, m.redeemed);
  const earned = medalsEarned(stars);
  const redeemed = m.redeemed || 0;
  const progress = ((stars % MEDAL_EVERY) / MEDAL_EVERY) * 100;
  const nextIn = MEDAL_EVERY - (stars % MEDAL_EVERY);

  container.setAttribute('data-speak', `勋章屋，已获得 ${avail} 枚勋章`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🏆 勋章屋</div>
        <div class="greet-sub">集齐 5 颗星光换 1 枚勋章</div>
      </div>
      <button class="btn-back" id="medalBack">🏠 返回</button>
    </header>
    <div class="medal-hero">
      <div class="medal-big">🎖️</div>
      <div class="medal-count">${avail}</div>
      <div class="medal-label">当前勋章</div>
    </div>
    <div class="panel-card">
      <h3>下一枚勋章</h3>
      <div class="medal-progress"><div class="medal-progress-bar" style="width:${progress}%"></div></div>
      <p class="desc">还差 <b>${nextIn}</b> 颗星光
        ${earned > 0 ? `（累计获得 ${earned} 枚 · 已兑换 ${redeemed} 枚）` : ''}</p>
    </div>
    <div class="panel-card">
      <h3>勋章记录</h3>
      <div id="medalHistory"></div>
    </div>
  `;

  // 历史记录逐节点构建（textContent，防止本地存储被篡改时注入）
  const historyWrap = document.getElementById('medalHistory');
  const items = Array.isArray(m.history) ? m.history.slice().reverse() : [];
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'desc';
    empty.textContent = '还没有勋章记录，加油集星光吧！';
    historyWrap.appendChild(empty);
  } else {
    for (const h of items) {
      const row = document.createElement('div');
      row.className = 'medal-history-item';
      const label = document.createElement('span');
      label.textContent = `${h.type === 'earn' ? '🎖️ 获得' : '🎁 兑换'} ${h.n} 枚`;
      const date = document.createElement('span');
      date.className = 'mh-date';
      date.textContent = h.date;
      row.appendChild(label);
      row.appendChild(date);
      historyWrap.appendChild(row);
    }
  }

  document.getElementById('medalBack').addEventListener('click', () => ctx.go('home'));
}
