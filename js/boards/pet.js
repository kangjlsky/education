/* =========================================================
   宠物板块：宠物展示 + 摸头/喂食互动 + 等级进度
   ctx 注入：speak/toast/getStars/getFeedCount/go
   宠物数据（等级/喂食次数）均由星光与打卡记录推导，无需额外存储
   ========================================================= */

import { petLevel, nextLevelIn, levelProgress } from '../core/pet.js';

/** 按等级返回宠物形象：成长变化 */
export function petAppearance(level) {
  if (level >= 6) return { ico: '🐉', scale: 1.5, name: '恐龙龙王' };
  if (level >= 3) return { ico: '🦖', scale: 1.2, name: '大恐龙' };
  return { ico: '🦎', scale: 1, name: '小恐龙' };
}

export function renderPet(container, ctx) {
  const stars = ctx.getStars();
  const level = petLevel(stars);
  const feed = ctx.getFeedCount();
  const app = petAppearance(level);
  const progress = levelProgress(stars) * 100;
  const remain = nextLevelIn(stars);

  container.setAttribute('data-speak', `宠物 ${app.name}，${level} 级`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🐾 我的宠物</div>
        <div class="greet-sub">${app.name} · Lv.${level}</div>
      </div>
      <button class="btn-back" id="petBack">🏠 返回</button>
    </header>
    <div class="pet-stage">
      <button class="pet-hero" id="petHero" aria-label="摸摸宠物" style="font-size:${110 * app.scale}px">
        ${app.ico}
      </button>
      <p class="hint">点一点宠物，摸摸它～</p>
    </div>
    <div class="pet-actions">
      <button class="btn-big pink" id="petFeed">🍖 喂食</button>
    </div>
    <div class="panel-card">
      <h3>📈 成长进度</h3>
      <div class="pet-level-row">
        <span>Lv.${level}</span>
        <div class="pet-progress"><div class="pet-progress-bar" style="width:${progress}%"></div></div>
        <span>Lv.${level + 1}</span>
      </div>
      <p class="desc">距升级还差 <b>${remain}</b> 颗星光</p>
      <p class="desc">🍽️ 今天喂食 <b>${feed}</b> 次（每完成一次打卡，宠物就吃饱一次）</p>
    </div>
  `;

  // 摸头：冒爱心
  document.getElementById('petHero').addEventListener('click', (e) => {
    spawnFloat(e.currentTarget, '❤️', 3);
    ctx.speak('咕噜咕噜～好舒服');
  });

  // 喂食：食物动画
  document.getElementById('petFeed').addEventListener('click', (e) => {
    spawnFloat(document.querySelector('.pet-hero'), '🍖', 3);
    ctx.speak('吧唧吧唧，真好吃！');
    ctx.toast('🍖 宠物吃饱啦');
  });

  document.getElementById('petBack').addEventListener('click', () => ctx.go('home'));
}

/** 从目标元素位置向上飘出 emoji（爱心/食物动画） */
function spawnFloat(el, emoji, count) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i += 1) {
    const s = document.createElement('div');
    s.className = 'pet-float';
    s.textContent = emoji;
    s.style.left = cx + (Math.random() * 60 - 30) + 'px';
    s.style.top = cy + 'px';
    s.style.animationDelay = i * 0.12 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
}
