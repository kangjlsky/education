/* =========================================================
   数学板块：6 阶段框架 + 阶段解锁 + 数一数/比大小游戏
   ctx 注入：speak/toast/starFlyAt/feedPet/checkin/go/getMathProgress
   ========================================================= */

import { MATH_STAGES, GAME_META } from '../data/math.js';
import {
  QUIZ_PER_ROUND,
  currentStage,
  isStageUnlocked,
  makeCountQuestion,
  makeCompareQuestion,
} from '../core/math.js';

const QUESTION_MAKERS = { count: makeCountQuestion, compare: makeCompareQuestion };

let mode = 'main';        // main | stage | play | done
let activeStage = null;
let activeGame = null;
let session = null;       // { questions, index, correct }

/** 重置板块内部状态（离开板块再进入时回到主视图） */
export function resetMath() {
  mode = 'main';
  activeStage = null;
  activeGame = null;
  session = null;
}

export function renderMath(container, ctx) {
  if (mode === 'play' || mode === 'done') renderPlay(container, ctx);
  else if (mode === 'stage') renderStage(container, ctx);
  else renderMain(container, ctx);
}

/* ---------- 主视图：6 阶段网格 ---------- */
function renderMain(container, ctx) {
  const doneGames = ctx.getMathProgress();
  const cur = currentStage(doneGames);

  const cards = MATH_STAGES.map((s) => {
    let status = '';
    let statusCls = '';
    if (!s.games.length) {
      status = '🚧 即将上线';
      statusCls = 'upcoming';
    } else {
      const done = (doneGames[s.id] || []).length;
      if (done >= s.games.length) {
        status = '✅ 完成';
        statusCls = 'ok';
      } else if (isStageUnlocked(s.id, doneGames)) {
        status = `进行中 ${done}/${s.games.length}`;
        statusCls = 'active';
      } else {
        status = '🔒 锁定';
        statusCls = 'locked';
      }
    }
    return `
      <button class="stage-card ${statusCls}" data-stage="${s.id}">
        <span class="sc-ico">${s.ico}</span>
        <span class="sc-name">${s.name}</span>
        <span class="sc-desc">${s.desc}</span>
        <span class="sc-status ${statusCls}">${status}</span>
      </button>`;
  }).join('');

  container.setAttribute('data-speak', '数学，从第一关开始挑战吧');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🔢 数学</div>
        <div class="greet-sub">完成关卡，解锁下一关</div>
      </div>
      <button class="btn-back" id="mathBack">🏠 返回</button>
    </header>
    <div class="stage-grid">${cards}</div>
    <p class="hint">✨ 每个小游戏玩完 3 题可打卡得星光</p>
  `;

  container.querySelectorAll('[data-stage]').forEach((el) => {
    el.addEventListener('click', () => {
      const s = MATH_STAGES.find((x) => x.id === Number(el.dataset.stage));
      if (!s) return;
      if (!s.games.length) {
        ctx.toast('🚧 这个阶段即将上线');
        ctx.speak('这个阶段即将上线，敬请期待');
        return;
      }
      if (!isStageUnlocked(s.id, doneGames)) {
        ctx.toast('🔒 先完成上一阶段吧');
        ctx.speak('先完成上一阶段，再挑战这一关');
        return;
      }
      activeStage = s.id;
      mode = 'stage';
      renderMath(container, ctx);
    });
  });
  document.getElementById('mathBack').addEventListener('click', () => ctx.go('home'));
}

/* ---------- 阶段内游戏列表 ---------- */
function renderStage(container, ctx) {
  const stage = MATH_STAGES.find((s) => s.id === activeStage);
  const doneGames = ctx.getMathProgress();
  if (!stage) {
    mode = 'main';
    renderMath(container, ctx);
    return;
  }
  const gameCards = stage.games
    .map((gid) => {
      const meta = GAME_META[gid];
      const done = ctx.hasCheckin('math', gid);
      return `
      <button class="game-card" data-game="${gid}">
        <span class="gc-ico">${meta.ico}</span>
        <span class="gc-name">${meta.name}</span>
        <span class="gc-desc">${meta.prompt}</span>
        <span class="gc-status${done ? ' done' : ''}">${done ? '🌸 已打卡' : '▶️ 开始'}</span>
      </button>`;
    })
    .join('');

  container.setAttribute('data-speak', `${stage.name}阶段，选一个游戏玩吧`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">${stage.ico} ${stage.name}</div>
        <div class="greet-sub">${stage.desc} · 已解锁</div>
      </div>
      <button class="btn-back" id="stageBack">⬅️ 返回</button>
    </header>
    ${gameCards}
    <p class="hint">✨ 玩完一轮可打卡得星光</p>
  `;

  container.querySelectorAll('[data-game]').forEach((el) => {
    el.addEventListener('click', () => {
      const gid = el.dataset.game;
      if (ctx.hasCheckin('math', gid)) {
        ctx.toast('这个游戏今天已打卡，明天再来吧');
        return;
      }
      activeGame = gid;
      startSession(ctx);
      renderPlay(container, ctx);
    });
  });
  document.getElementById('stageBack').addEventListener('click', () => {
    mode = 'main';
    renderMath(container, ctx);
  });
}

/* ---------- 游戏视图 ---------- */
function startSession() {
  const maker = QUESTION_MAKERS[activeGame];
  const questions = [];
  for (let i = 0; i < QUIZ_PER_ROUND; i += 1) {
    questions.push(maker());
  }
  session = { questions, index: 0, correct: 0 };
  mode = 'play';
}

function renderPlay(container, ctx) {
  if (mode === 'done') {
    renderDone(container, ctx);
    return;
  }
  const meta = GAME_META[activeGame];
  const q = session.questions[session.index];

  container.setAttribute('data-speak', meta.prompt);
  const body =
    activeGame === 'count'
      ? `
      <div class="quiz-target">${q.emojis}</div>
      <div class="quiz-options quiz-options-num">
        ${q.options.map((n, i) => `<button class="quiz-opt num" data-i="${i}">${n}</button>`).join('')}
      </div>`
      : `
      <div class="compare-row">
        <div class="compare-side">
          <div class="compare-emoji">${q.emoji.repeat(q.leftCount)}</div>
          <button class="btn-big ghost" data-side="left">⬅️ 左边多</button>
        </div>
        <div class="compare-side">
          <div class="compare-emoji">${q.emoji.repeat(q.rightCount)}</div>
          <button class="btn-big ghost" data-side="right">右边多 ➡️</button>
        </div>
      </div>`;

  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">${meta.ico} ${meta.name}</div>
        <div class="greet-sub">${meta.prompt}</div>
      </div>
      <button class="btn-back" id="playBack">⬅️ 返回</button>
    </header>
    ${body}
    <p class="hint">第 ${session.index + 1} / ${session.questions.length} 题 · 答对 ${session.correct} 题</p>
  `;

  container.querySelectorAll('.quiz-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = q.options[Number(btn.dataset.i)];
      if (val === q.answer) {
        ctx.starFlyAt(btn);
        session.correct += 1;
        session.index += 1;
        if (session.index >= session.questions.length) {
          mode = 'done';
          ctx.speak(session.correct === session.questions.length ? '全部答对，太厉害了！' : `答对 ${session.correct} 题，继续加油`);
        } else {
          ctx.speak('答对啦，真棒！');
        }
        renderPlay(container, ctx);
      } else {
        btn.disabled = true;
        btn.classList.add('wrong');
        ctx.speak('再想想，换一个试试～');
      }
    });
  });
  container.querySelectorAll('[data-side]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.side === q.answer) {
        ctx.starFlyAt(btn);
        session.correct += 1;
        session.index += 1;
        if (session.index >= session.questions.length) {
          mode = 'done';
          ctx.speak(session.correct === session.questions.length ? '全部答对，太厉害了！' : `答对 ${session.correct} 题，继续加油`);
        } else {
          ctx.speak('答对啦，真棒！');
        }
        renderPlay(container, ctx);
      } else {
        btn.disabled = true;
        btn.classList.add('wrong');
        ctx.speak('再数数看，哪边更多呢？');
      }
    });
  });
  document.getElementById('playBack').addEventListener('click', () => {
    mode = 'stage';
    renderMath(container, ctx);
  });
}

/* ---------- 完成：打卡得星光 ---------- */
function renderDone(container, ctx) {
  const meta = GAME_META[activeGame];
  const total = session.questions.length;
  const correct = session.correct;
  const checked = ctx.hasCheckin('math', activeGame);

  container.setAttribute('data-speak', `挑战完成，答对 ${correct} 题`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🎉 挑战完成</div>
        <div class="greet-sub">${correct === total ? '全部答对，太厉害了！' : `答对 ${correct} / ${total} 题`}</div>
      </div>
      <button class="btn-back" id="doneBack">⬅️ 返回</button>
    </header>
    <div class="empty">
      <span class="big">${correct === total ? '🏆' : '🌟'}</span>
      ${correct === total ? '你太棒了！' : '多练几次就会啦！'}
    </div>
    ${
      checked
        ? '<button class="btn-big ghost" disabled>🌸 今天已打卡</button>'
        : '<button class="btn-big pink" id="doneCheckin">🎖️ 完成打卡 +1 星光</button>'
    }
  `;

  document.getElementById('doneBack').addEventListener('click', () => {
    mode = 'stage';
    renderMath(container, ctx);
  });
  const btn = document.getElementById('doneCheckin');
  if (btn) {
    btn.addEventListener('click', () => {
      const r = ctx.checkin('math', activeGame);
      if (r.ok) {
        ctx.starFlyAt(btn);
        ctx.feedPet();
        ctx.speak('太棒啦！获得一颗星光！');
        ctx.toast('⭐ +1 星光');
        renderDone(container, ctx);
      } else {
        ctx.toast('今天这个游戏已打卡啦');
      }
    });
  }
}
