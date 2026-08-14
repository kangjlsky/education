/* =========================================================
   国学板块：古诗列表 + 学习页（逐句朗读）+ 打卡得星光
   ctx 由 app.js 注入：speak/toast/starFlyAt/feedPet/checkin/
   hasCheckin/go
   ========================================================= */

import { POEMS } from '../data/poems.js';
import { CLASSICS } from '../data/classics.js';
import { unlockedClassics, CLASSICS_PER_TEN } from '../core/classics.js';

let activePoemId = null;
let activeClassicId = null; // 古文学习页当前篇目

/** 重置板块内部状态（离开板块再进入时回到列表） */
export function resetPoems() {
  activePoemId = null;
  activeClassicId = null;
}

export function renderPoems(container, ctx) {
  if (activeClassicId) renderClassicStudy(container, ctx);
  else if (activePoemId) renderStudy(container, ctx);
  else renderList(container, ctx);
}

/* ---------- 列表页 ---------- */
function renderList(container, ctx) {
  container.setAttribute('data-speak', '国学，点一首古诗学一学吧');
  const reviewDay = ctx.isReviewDay ? ctx.isReviewDay() : false;
  const reviewExtra = ctx.getReviewPoems ? ctx.getReviewPoems() : [];

  const reviewCards = reviewExtra
    .map((id) => {
      const p = POEMS.find((x) => x.id === id);
      if (!p) return '';
      const done = ctx.hasCheckin('poems', p.id);
      return `
      <button class="poem-card" data-id="${p.id}" aria-label="复习古诗 ${p.name}">
        <span class="pc-ico">${p.ico}</span>
        <span class="pc-name">${p.name}</span>
        <span class="pc-author">${p.author}</span>
        <span class="pc-status${done ? ' done' : ''}">${done ? '🌸' : '🔁'}</span>
      </button>`;
    })
    .join('');

  const cards = POEMS.map((p) => {
    const done = ctx.hasCheckin('poems', p.id);
    return `
      <button class="poem-card" data-id="${p.id}" aria-label="学习古诗 ${p.name}">
        <span class="pc-ico">${p.ico}</span>
        <span class="pc-name">${p.name}</span>
        <span class="pc-author">${p.author}</span>
        <span class="pc-status${done ? ' done' : ''}">${done ? '🌸' : ''}</span>
      </button>`;
  }).join('');

  // 古文馆（每学满 10 首古诗解锁 1 篇）
  const learnedPoemCount = (ctx.getLearnedPoems ? ctx.getLearnedPoems() : []).length;
  const unlocked = unlockedClassics(learnedPoemCount, CLASSICS.length);
  const classicCards = CLASSICS.map((c, i) => {
    const isUnlocked = unlocked.includes(i);
    const done = ctx.hasCheckin('poems', c.id);
    if (!isUnlocked) {
      // 每篇按各自解锁门槛单独计算（第 i+1 篇需 (i+1)*10 首）
      const need = (i + 1) * CLASSICS_PER_TEN - learnedPoemCount;
      return `
      <div class="classic-card locked">
        <span class="pc-ico">🔒</span>
        <span class="pc-name">${c.name}</span>
        <span class="pc-lock">还需学 ${need} 首解锁</span>
      </div>`;
    }
    return `
      <button class="poem-card" data-classic="${c.id}" aria-label="学习古文 ${c.name}">
        <span class="pc-ico">📜</span>
        <span class="pc-name">${c.name}</span>
        <span class="pc-author">${c.source}</span>
        <span class="pc-status${done ? ' done' : ''}">${done ? '🌸' : ''}</span>
      </button>`;
  }).join('');

  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">📖 国学</div>
        <div class="greet-sub">点一首古诗，跟读学一学</div>
      </div>
      <button class="btn-back" id="poemBack">🏠 返回</button>
    </header>
    ${reviewDay ? '<div class="review-banner">🔁 今天是古诗复习日，背一背学过的诗吧！</div>' : ''}
    ${reviewCards ? `
      <div class="panel-card">
        <h3>🔁 复习抽查</h3>
        ${reviewCards}
      </div>` : ''}
    <div class="poem-list">${cards}</div>
    <div class="panel-card">
      <h3>📜 古文馆 <span class="badge">${unlocked.length}/${CLASSICS.length}</span></h3>
      ${classicCards}
      <p class="desc">每学满 10 首古诗，解锁 1 篇经典古文！</p>
    </div>
    <p class="hint">✨ 学完点"我会背啦"得星光</p>
  `;

  container.querySelectorAll('[data-id]').forEach((el) => {
    el.addEventListener('click', () => {
      activePoemId = el.dataset.id;
      renderPoems(container, ctx);
    });
  });
  container.querySelectorAll('[data-classic]').forEach((el) => {
    el.addEventListener('click', () => {
      activeClassicId = el.dataset.classic;
      renderPoems(container, ctx);
    });
  });
  document.getElementById('poemBack').addEventListener('click', () => ctx.go('home'));
}

/* ---------- 古文学习页 ---------- */
function renderClassicStudy(container, ctx) {
  const c = CLASSICS.find((x) => x.id === activeClassicId);
  if (!c) {
    activeClassicId = null;
    renderList(container, ctx);
    return;
  }
  const done = ctx.hasCheckin('poems', c.id);
  container.setAttribute('data-speak', `${c.name}，${c.source}`);

  const lines = c.text
    .map(
      (line, i) => `
      <button class="poem-line" data-line="${i}" aria-label="朗读：${line}">${line}</button>`
    )
    .join('');

  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">📜 ${c.name}</div>
        <div class="greet-sub">${c.source} · 点句子听朗读</div>
      </div>
      <button class="btn-back" id="classicBack">📚 返回</button>
    </header>
    <div class="poem-body">
      <button class="poem-title" id="classicTitle" aria-label="朗读篇名">${c.name}</button>
      ${lines}
    </div>
    <button class="poem-trans" id="classicTrans" aria-label="听译文">💡 ${c.trans}</button>
    ${
      done
        ? '<button class="btn-big ghost" disabled>🌸 今天已打卡</button>'
        : '<button class="btn-big pink" id="classicCheckin">🎉 我会背啦！</button>'
    }
  `;

  container.querySelectorAll('[data-line]').forEach((el) => {
    el.addEventListener('click', () => ctx.speak(c.text[Number(el.dataset.line)]));
  });
  document.getElementById('classicTitle').addEventListener('click', () => ctx.speak(`${c.name}，${c.source}`));
  document.getElementById('classicTrans').addEventListener('click', () => ctx.speak(c.trans));
  // 古文返回 → 回到古诗列表
  document.getElementById('classicBack').addEventListener('click', () => {
    activeClassicId = null;
    renderPoems(container, ctx);
  });

  const btn = document.getElementById('classicCheckin');
  if (btn) {
    btn.addEventListener('click', () => {
      const r = ctx.checkin('poems', c.id);
      if (r.ok) {
        ctx.starFlyAt(btn);
        ctx.feedPet();
        ctx.speak('太棒啦！古文背下来了，获得一颗星光！');
        ctx.toast('⭐ +1 星光');
      } else {
        ctx.toast('这篇古文今天已经打过卡啦');
      }
      renderClassicStudy(container, ctx); // 重渲染为已打卡状态
    });
  }
}

/* ---------- 学习页 ---------- */
function renderStudy(container, ctx) {
  const p = POEMS.find((x) => x.id === activePoemId);
  if (!p) {
    activePoemId = null;
    renderList(container, ctx);
    return;
  }
  const done = ctx.hasCheckin('poems', p.id);
  container.setAttribute('data-speak', `${p.name}，${p.author}`);

  const lines = p.text
    .map(
      (line, i) => `
      <button class="poem-line" data-line="${i}" aria-label="朗读：${line}">${line}</button>`
    )
    .join('');

  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">${p.ico} ${p.name}</div>
        <div class="greet-sub">${p.author} · 点句子听朗读</div>
      </div>
      <button class="btn-back" id="poemBack">📚 返回</button>
    </header>
    <div class="poem-body">
      <button class="poem-title" id="poemTitle" aria-label="朗读诗名">${p.name}</button>
      ${lines}
    </div>
    <button class="poem-trans" id="poemTrans" aria-label="听译文">💡 ${p.trans}</button>
    ${
      done
        ? '<button class="btn-big ghost" disabled>🌸 今天已打卡</button>'
        : '<button class="btn-big pink" id="poemCheckin">🎉 我会背啦！</button>'
    }
  `;

  container.querySelectorAll('[data-line]').forEach((el) => {
    el.addEventListener('click', () => ctx.speak(p.text[Number(el.dataset.line)]));
  });
  document.getElementById('poemTitle').addEventListener('click', () => ctx.speak(`${p.name}，${p.author}`));
  document.getElementById('poemTrans').addEventListener('click', () => ctx.speak(p.trans));
  // 学习页返回 → 回到古诗列表（列表页的返回才回首页）
  document.getElementById('poemBack').addEventListener('click', () => {
    activePoemId = null;
    renderPoems(container, ctx);
  });

  const btn = document.getElementById('poemCheckin');
  if (btn) {
    btn.addEventListener('click', () => {
      const r = ctx.checkin('poems', p.id);
      if (r.ok) {
        ctx.starFlyAt(btn);
        ctx.feedPet();
        ctx.speak('太棒啦！获得一颗星光，宠物也吃饱啦！');
        ctx.toast('⭐ +1 星光');
      } else {
        ctx.toast('今天这首已经打过卡啦');
      }
      renderPoems(container, ctx); // 重渲染为已打卡状态
    });
  }
}
