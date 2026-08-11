/* =========================================================
   识字板块：今日新字 + 旧字滚动复习 + 4 选 1 小测
   ctx 注入：speak/toast/starFlyAt/checkin/hasCheckin/go/
            today/getWeekWords/getLearnedWords
   ========================================================= */

import { WORDS } from '../data/words.js';
import { pickDailyNewWords, makeWordQuiz } from '../core/words.js';
import { pickReviewWords } from '../core/review.js';

let mode = 'main';        // main | quiz | quizDone
let quiz = null;          // { items, index, correct }

/** 重置板块内部状态（离开板块再进入时回到主视图） */
export function resetWords() {
  mode = 'main';
  quiz = null;
}

export function renderWords(container, ctx) {
  if (mode === 'quiz' || mode === 'quizDone') renderQuiz(container, ctx);
  else renderMain(container, ctx);
}

/* ---------- 主视图：今日新字 + 复习区 + 小测入口 ---------- */
function renderMain(container, ctx) {
  const today = ctx.today();
  const weekWords = ctx.getWeekWords() || [];
  const learnedMap = ctx.getLearnedWords() || {};
  const learnedIds = Object.keys(learnedMap);
  const perDay = Math.max(1, Math.ceil(weekWords.length / 5)); // 每日数量从周计划量推导
  // 今日展示：未学推荐（前 perDay 个）+ 今日已打卡（打卡后仍显示 ✅）
  const newToday = [
    ...new Set([
      ...pickDailyNewWords(weekWords, learnedIds, today, perDay),
      ...weekWords.filter((id) => ctx.hasCheckin('words', id)),
    ]),
  ];
  const weekDone = weekWords.filter((id) => learnedMap[id]).length;
  const reviewDue = pickReviewWords(learnedMap, today);

  container.setAttribute(
    'data-speak',
    `识字，今天学 ${newToday.length} 个新字${reviewDue.length ? `，还有 ${reviewDue.length} 个复习字` : ''}`
  );
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">✏️ 识字</div>
        <div class="greet-sub">认新字 复习旧字 玩小测</div>
      </div>
      <button class="btn-back" id="wordBack">🏠 返回</button>
    </header>
    <div class="panel-card">
      <h3>📖 今日新字 <span class="badge">本周 ${weekDone}/${weekWords.length}</span></h3>
      ${newToday.length ? newToday.map((id) => wordCard(id, ctx, false)).join('') : '<p class="desc">今天没有新字任务，休息一下吧～</p>'}
    </div>
    ${
      reviewDue.length
        ? `
      <div class="panel-card">
        <h3>🔁 复习旧字 <span class="badge">${reviewDue.length} 个到期</span></h3>
        ${reviewDue.map((id) => wordCard(id, ctx, true)).join('')}
      </div>`
        : ''
    }
    <button class="btn-big pink" id="wordQuiz">🎯 认字小挑战</button>
  `;

  container.querySelectorAll('[data-word-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const id = el.dataset.wordId;
      const w = WORDS.find((x) => x.id === id);
      if (!w) return;
      if (e.target.closest('.word-checkin')) {
        doCheckin(id, el, ctx);
      } else {
        ctx.speak(`${w.char}，${w.phrase}`);
      }
    });
  });
  document.getElementById('wordQuiz').addEventListener('click', () => startQuiz(ctx));
  document.getElementById('wordBack').addEventListener('click', () => ctx.go('home'));
}

/** 单字卡片（大字 + 图 + 拼音 + 短语 + 打卡按钮） */
function wordCard(id, ctx, isReview) {
  const w = WORDS.find((x) => x.id === id);
  if (!w) return '';
  const done = ctx.hasCheckin('words', id);
  return `
    <div class="word-card" data-word-id="${w.id}">
      <span class="wc-char">${w.char}</span>
      <span class="wc-pic">${w.pic}</span>
      <span class="wc-info">
        <span class="wc-py">${w.py}</span>
        <span class="wc-phrase">${w.phrase}</span>
      </span>
      ${
        done
          ? '<span class="wc-done">✅ 学过</span>'
          : `<button class="word-checkin ${isReview ? 'ghost' : ''}">✏️ 学会啦</button>`
      }
    </div>`;
}

function doCheckin(id, cardEl, ctx) {
  const container = cardEl.closest('.view');
  const r = ctx.checkin('words', id);
  if (r.ok) {
    ctx.starFlyAt(cardEl.querySelector('.word-checkin'));
    ctx.feedPet();
    ctx.speak('太棒啦！又认识一个新字！');
    ctx.toast('⭐ +1 星光');
    renderWords(container, ctx);
  } else {
    ctx.toast('这个字今天已经学过啦');
  }
}

/* ---------- 小测 ---------- */
function startQuiz(ctx) {
  const today = ctx.today();
  const learnedMap = ctx.getLearnedWords() || {};
  const learnedIds = Object.keys(learnedMap);
  const weekWords = ctx.getWeekWords() || [];
  const perDay = Math.max(1, Math.ceil(weekWords.length / 5));
  const ids = [
    ...new Set([
      ...pickDailyNewWords(weekWords, learnedIds, today, perDay),
      ...pickReviewWords(learnedMap, today),
      ...weekWords,
    ]),
  ];
  let items = ids.map((id) => WORDS.find((w) => w.id === id)).filter(Boolean);
  if (items.length < 4) {
    items = [...items, ...WORDS.filter((w) => !items.includes(w))].slice(0, 4);
  }
  quiz = { items, index: 0, correct: 0 };
  mode = 'quiz';
  renderWords(document.getElementById('view'), ctx);
}

function renderQuiz(container, ctx) {
  if (mode === 'quizDone') {
    renderQuizDone(container, ctx);
    return;
  }
  const item = quiz.items[quiz.index];
  const q = makeWordQuiz(item, WORDS);
  const pic2char = quiz.index % 2 === 0; // 交替：看图选字 / 看字选图
  const prompt = pic2char ? item.pic : item.char;

  container.setAttribute('data-speak', pic2char ? '看图选字' : '看字选图');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🎯 认字小挑战</div>
        <div class="greet-sub">${pic2char ? '看看图片，选出正确的字' : '看看这个字，选出正确的图'}</div>
      </div>
      <button class="btn-back" id="quizBack">⬅️ 返回</button>
    </header>
    <div class="quiz-prompt">
      <div class="quiz-target">${prompt}</div>
      <p class="hint">点一点，选出正确答案</p>
    </div>
    <div class="quiz-options">
      ${q.options
        .map(
          (o, i) => `
        <button class="quiz-opt" data-i="${i}">${pic2char ? o.char : o.pic}</button>`
        )
        .join('')}
    </div>
    <p class="hint">第 ${quiz.index + 1} / ${quiz.items.length} 题 · 答对 ${quiz.correct} 题</p>
  `;

  container.querySelectorAll('.quiz-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const o = q.options[Number(btn.dataset.i)];
      if (o.id === item.id) {
        ctx.starFlyAt(btn);
        ctx.speak('答对啦，真棒！');
        quiz.correct += 1;
        quiz.index += 1;
        if (quiz.index >= quiz.items.length) {
          mode = 'quizDone';
        }
        renderQuiz(container, ctx);
      } else {
        // 温柔提示：该选项标记错误，可重试
        btn.disabled = true;
        btn.classList.add('wrong');
        ctx.speak('再想想，换一个试试～');
      }
    });
  });
  document.getElementById('quizBack').addEventListener('click', () => {
    mode = 'main';
    renderWords(container, ctx);
  });
}

function renderQuizDone(container, ctx) {
  const total = quiz.items.length;
  const correct = quiz.correct;
  container.setAttribute('data-speak', `挑战完成，答对 ${correct} 题`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🎯 挑战完成</div>
        <div class="greet-sub">${correct === total ? '全部答对，太厉害了！' : `答对 ${correct} / ${total} 题`}</div>
      </div>
      <button class="btn-back" id="quizDoneBack">⬅️ 返回</button>
    </header>
    <div class="empty">
      <span class="big">${correct === total ? '🏆' : '🌟'}</span>
      ${correct === total ? '你是认字小冠军！' : '再练练，下次全对！'}
    </div>
    <button class="btn-big" id="quizAgain">🔁 再玩一次</button>
  `;
  ctx.speak(correct === total ? '全部答对，太厉害了！' : `答对 ${correct} 题，继续加油`);
  document.getElementById('quizDoneBack').addEventListener('click', () => {
    mode = 'main';
    renderWords(container, ctx);
  });
  document.getElementById('quizAgain').addEventListener('click', () => {
    quiz.index = 0;
    quiz.correct = 0;
    mode = 'quiz';
    renderQuiz(container, ctx);
  });
}
