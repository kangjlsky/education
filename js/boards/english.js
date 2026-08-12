/* =========================================================
   英语板块：单词卡 + 绘本跟读 + 周六复盘 + 打卡
   ctx 注入：speak/speakEn/toast/starFlyAt/feedPet/checkin/
            hasCheckin/go/today/getWeekBooks/getEnglishLearned
   ========================================================= */

import { ENGLISH_WORDS, ENGLISH_BOOKS } from '../data/english.js';
import { pickDailyNewWords } from '../core/words.js';
import { isSaturday } from '../core/review.js';
import { mondayOf } from '../core/dates.js';

const WORDS_PER_DAY = 2;

let mode = 'main';   // main | book
let activeBookId = null;
let pageIndex = 0;

/** 重置板块内部状态 */
export function resetEnglish() {
  mode = 'main';
  activeBookId = null;
  pageIndex = 0;
}

export function renderEnglish(container, ctx) {
  if (mode === 'book') renderBook(container, ctx);
  else renderMain(container, ctx);
}

/* ---------- 主视图：今日新词 + 本周绘本 + 周六复盘 ---------- */
function renderMain(container, ctx) {
  const today = ctx.today();
  const learnedMap = ctx.getEnglishLearned() || {};
  const learnedIds = Object.keys(learnedMap);
  const weekBooks = ctx.getWeekBooks() || [];
  const reviewDay = isSaturday(today);

  // 今日新词（未学锚定 + 今日已打卡保留显示）
  const fresh = pickDailyNewWords(
    ENGLISH_WORDS.map((w) => w.id),
    learnedIds,
    today,
    WORDS_PER_DAY
  );
  const doneWords = ENGLISH_WORDS.filter((w) => ctx.hasCheckin('english', w.id)).map((w) => w.id);
  const shownWords = [...new Set([...fresh, ...doneWords])];
  const weekDone = ENGLISH_WORDS.filter((w) => learnedMap[w.id]).length;

  // 周六复盘：本周学过的单词（learnedMap 中日期在本周内）
  let reviewWords = [];
  if (reviewDay) {
    const weekStart = mondayOf(today);
    reviewWords = Object.entries(learnedMap)
      .filter(([, d]) => d && d >= weekStart)
      .map(([id]) => ENGLISH_WORDS.find((w) => w.id === id))
      .filter(Boolean);
  }

  const wordCards = shownWords
    .map((id) => {
      const w = ENGLISH_WORDS.find((x) => x.id === id);
      if (!w) return '';
      const done = ctx.hasCheckin('english', w.id);
      return `
      <div class="en-word" data-word="${w.id}">
        <button class="en-sound" data-speak="${w.word}" aria-label="听发音">🔊</button>
        <span class="enw-char">${w.word}</span>
        <span class="enw-pic">${w.ico}</span>
        <span class="enw-info">
          <span class="enw-cn">${w.cn} · ${w.py}</span>
        </span>
        ${
          done
            ? '<span class="wc-done">✅ 学过</span>'
            : `<button class="word-checkin" data-checkin="${w.id}">✏️ 学会啦</button>`
        }
      </div>`;
    })
    .join('');

  const doneBooks = ctx.getEnglishBooksDone ? ctx.getEnglishBooksDone() : [];
  const bookCards = weekBooks
    .map((id) => {
      const b = ENGLISH_BOOKS.find((x) => x.id === id);
      if (!b) return '';
      const done = ctx.hasCheckin('english', b.id);
      return `
      <button class="book-card" data-book="${b.id}">
        <span class="bk-ico">${b.ico}</span>
        <span class="bk-title">${b.title}</span>
        <span class="bk-status${done ? ' done' : ''}">${done ? '🌸 已读' : '📖 读一读'}</span>
      </button>`;
    })
    .join('');

  container.setAttribute('data-speak', '英语，学单词，读绘本');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🔠 英语</div>
        <div class="greet-sub">学单词 读绘本 磨耳朵</div>
      </div>
      <button class="btn-back" id="enBack">🏠 返回</button>
    </header>
    ${reviewDay ? '<div class="review-banner">🔁 今天是英语复盘日，复习本周单词和绘本吧！</div>' : ''}
    <div class="panel-card">
      <h3>🔤 今日新词 <span class="badge">已学 ${weekDone}/${ENGLISH_WORDS.length}</span></h3>
      ${wordCards || '<p class="desc">今天没有新单词任务，休息一下吧～</p>'}
    </div>
    <div class="panel-card">
      <h3>📚 本周绘本 <span class="badge">已读 ${weekBooks.filter((id) => doneBooks.includes(id)).length}/${weekBooks.length}</span></h3>
      ${bookCards || '<p class="desc">本周还没有绘本计划～</p>'}
    </div>
    ${
      reviewDay && reviewWords.length
        ? `
      <div class="panel-card">
        <h3>🔁 本周单词回顾</h3>
        ${reviewWords
          .map(
            (w) => `
          <button class="review-word" data-speak="${w.word}">
            ${w.ico} ${w.word} <span class="rw-cn">${w.cn}</span>
          </button>`
          )
          .join('')}
      </div>`
        : ''
    }
    <p class="hint">✨ 读完一本绘本可打卡得星光</p>
  `;

  container.querySelectorAll('[data-speak]').forEach((el) => {
    el.addEventListener('click', () => ctx.speakEn(el.dataset.speak));
  });
  container.querySelectorAll('[data-checkin]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      doWordCheckin(el.dataset.checkin, el, ctx);
    });
  });
  container.querySelectorAll('[data-book]').forEach((el) => {
    el.addEventListener('click', () => {
      activeBookId = el.dataset.book;
      pageIndex = 0;
      mode = 'book';
      renderEnglish(container, ctx);
    });
  });
  document.getElementById('enBack').addEventListener('click', () => ctx.go('home'));
}

function doWordCheckin(id, btnEl, ctx) {
  const r = ctx.checkin('english', id);
  if (r.ok) {
    ctx.starFlyAt(btnEl);
    ctx.feedPet();
    ctx.speak('太棒啦！又认识一个英文单词！');
    ctx.toast('⭐ +1 星光');
    renderEnglish(document.getElementById('view'), ctx);
  } else {
    ctx.toast('这个单词今天已经学过啦');
  }
}

/* ---------- 绘本阅读 ---------- */
function renderBook(container, ctx) {
  const book = ENGLISH_BOOKS.find((b) => b.id === activeBookId);
  if (!book) {
    mode = 'main';
    renderEnglish(container, ctx);
    return;
  }
  const page = book.pages[pageIndex];
  const done = ctx.hasCheckin('english', book.id);
  const isLast = pageIndex === book.pages.length - 1;

  container.setAttribute('data-speak', `${book.title}，第 ${pageIndex + 1} 页`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">${book.ico} ${book.title}</div>
        <div class="greet-sub">第 ${pageIndex + 1} / ${book.pages.length} 页 · 点句子听发音</div>
      </div>
      <button class="btn-back" id="bookBack">⬅️ 返回</button>
    </header>
    <div class="book-page">
      <div class="book-ico">${page.ico}</div>
      <button class="book-sentence" id="bookSpeak">🔊 ${page.en}</button>
      <div class="book-cn">${page.cn}</div>
    </div>
    <div class="book-nav">
      <button class="btn-big ghost" id="bookPrev" ${pageIndex === 0 ? 'disabled' : ''}>⬅️ 上一页</button>
      ${
        isLast
          ? done
            ? '<button class="btn-big ghost" disabled>🌸 今天已读</button>'
            : '<button class="btn-big pink" id="bookDone">🎉 读完啦，打卡！</button>'
          : '<button class="btn-big" id="bookNext">下一页 ➡️</button>'
      }
    </div>
  `;

  document.getElementById('bookSpeak').addEventListener('click', () => ctx.speakEn(page.en));
  document.getElementById('bookBack').addEventListener('click', () => {
    mode = 'main';
    renderEnglish(container, ctx);
  });
  const prev = document.getElementById('bookPrev');
  if (prev) {
    prev.addEventListener('click', () => {
      if (pageIndex > 0) {
        pageIndex -= 1;
        renderBook(container, ctx);
      }
    });
  }
  const next = document.getElementById('bookNext');
  if (next) {
    next.addEventListener('click', () => {
      pageIndex += 1;
      renderBook(container, ctx);
    });
  }
  const doneBtn = document.getElementById('bookDone');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      const r = ctx.checkin('english', book.id);
      if (r.ok) {
        ctx.starFlyAt(doneBtn);
        ctx.feedPet();
        ctx.speak(`太棒啦！读完绘本 ${book.title}！`);
        ctx.toast('⭐ +1 星光');
        renderBook(container, ctx);
      } else {
        ctx.toast('这本绘本今天已打卡啦');
      }
    });
  }
}
