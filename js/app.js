/* =========================================================
   柠柠学习工作台 - 入口与核心逻辑（ES Module）
   Ticket 01：PWA 壳 + 儿童首页 + 家长门禁 + 导航框架
   后续板块（02-09）与家长后台（10-11）在此基础上扩展
   ========================================================= */

import { createState, verify, changePassword, isLocked, DEFAULT_PASSWORD } from './core/password.js';
import { addCheckin, hasCheckin } from './core/stars.js';
import { toDateStr, addDays, mondayOf } from './core/dates.js';
import { newMedals } from './core/medals.js';
import { settleWeek, WEEK_BONUS, pendingWeeks } from './core/attendance.js';
import { buildWeekPlan } from './core/plan.js';
import { isSunday, dailyTargets, pickPoemReview } from './core/review.js';
import { POEMS } from './data/poems.js';
import { WORDS } from './data/words.js';
import { renderPoems, resetPoems } from './boards/poems.js';
import { renderMedals } from './boards/medals.js';
import { renderWords, resetWords } from './boards/words.js';
import { renderMath, resetMath } from './boards/math.js';
import { gameStage } from './core/math.js';

/* ---------- 常量 ---------- */
const SETTINGS_KEY = 'ning.settings'; // 家长设置（含密码状态）
const SCORE_KEY = 'ning.stars';       // 星光总数
const LOGS_KEY = 'ning.logs';         // 打卡记录数组
const MEDALS_KEY = 'ning.medals';     // 勋章状态 { redeemed, history }
const SETTLED_KEY = 'ning.settledWeek'; // 已结算的周（weekStart）
const WEEK_PLAN_KEY = 'ning.weekPlan';  // 本周计划 { weekStart, poems, words, books, reviewPoems?, reviewDate? }

// 各科内容池（books 在英语板块 ticket 实现后加入）
const CONTENT_POOL = {
  poems: POEMS.map((p) => p.id),
  words: WORDS.map((w) => w.id),
  books: [],
};

// 每周任务量（ticket 11 家长后台可配置）
const WEEK_COUNTS = { poems: 3, words: 10, books: 3 };

/* ---------- 6 大板块配置（占位；后续板块 ticket 填充实现） ---------- */
const BOARDS = [
  { key: 'poems',  ico: '📖', name: '国学', desc: '背古诗 学古文', color: 'blue' },
  { key: 'words',  ico: '✏️', name: '识字', desc: '认字小达人',   color: 'pink' },
  { key: 'math',   ico: '🔢', name: '数学', desc: '数一数 算一算', color: 'blue' },
  { key: 'english',ico: '🔠', name: '英语', desc: '学单词 读绘本', color: 'pink' },
  { key: 'pen',    ico: '🖍️', name: '控笔', desc: '描一描 写一写', color: 'blue' },
  { key: 'medals', ico: '🏆', name: '勋章', desc: '看看我的勋章', color: 'pink' },
];

/* ---------- 本地存储 ---------- */
const Store = {
  load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch {
      return fallback;
    }
  },
  save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
};

/* ---------- 全局状态 ---------- */
let settings = Store.load(SETTINGS_KEY, null) || createState();
const rawScore = Store.load(SCORE_KEY, 0);
let score = Number.isFinite(Number(rawScore)) && Number(rawScore) >= 0 ? Math.floor(Number(rawScore)) : 0;
let logs = Store.load(LOGS_KEY, []);
let currentView = 'home';   // home | gate | setpwd | parent | board
let activeBoard = null;     // 当前板块 key
let gateInput = '';         // 密码输入缓冲区
let lockTimer = null;       // 锁定倒计时定时器
let medals = Store.load(MEDALS_KEY, { redeemed: 0, history: [] }); // 勋章状态
let settledWeek = Store.load(SETTLED_KEY, null); // 已结算周
let weekPlan = Store.load(WEEK_PLAN_KEY, null);  // 本周计划

// 存储健壮性：脏数据（旧版本/被篡改）规范化，避免运行期崩溃
if (!medals || typeof medals !== 'object' || Array.isArray(medals)) medals = { redeemed: 0, history: [] };
if (!Number.isInteger(medals.redeemed) || medals.redeemed < 0) medals.redeemed = 0;
if (!Array.isArray(medals.history)) medals.history = [];
if (typeof settledWeek !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(settledWeek)) settledWeek = null;
if (!weekPlan || typeof weekPlan !== 'object' || Array.isArray(weekPlan) || typeof weekPlan.weekStart !== 'string') weekPlan = null;

const view = document.getElementById('view');

/* ---------- 语音（Web Speech API；增强能力，无声可 100% 操作） ---------- */
const Speak = {
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { /* 触发 voices 就绪 */ };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  },
  zh(text) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.75;   // 放慢语速，适合低幼
    u.pitch = 1.1;   // 音调略高，更亲切
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith('zh'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  },
  stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  },
};

/* ---------- 小提示 ---------- */
function toast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

/* ---------- 板块渲染注册表：已实现的板块在此登记，未登记的走占位 ---------- */
const BOARD_RENDERERS = {
  poems: { render: renderPoems, reset: resetPoems },
  words: { render: renderWords, reset: resetWords },
  math: { render: renderMath, reset: resetMath },
  medals: { render: renderMedals },
};

/* ---------- 打卡工具（积分引擎接入） ---------- */
function todayStr() {
  return toDateStr(new Date());
}

/** 执行打卡：去重 + 持久化 + 星光/勋章/全勤结算（返回引擎结果） */
function checkin(subject, item) {
  const date = todayStr();
  const r = addCheckin(logs, score, { date, subject, item, ts: Date.now() });
  if (r.ok) {
    logs = r.logs;
    Store.save(LOGS_KEY, logs);
    awardStars(1, date);
    settleWeekIfDue();
  }
  return r;
}

/** 统一加星光：持久化 + 检测新勋章并庆祝 */
function awardStars(delta, date) {
  const before = score;
  score += delta;
  Store.save(SCORE_KEY, score);
  const gained = newMedals(before, score);
  if (gained > 0) {
    medals.history.push({ date, type: 'earn', n: gained, stars: score });
    Store.save(MEDALS_KEY, medals);
    celebrateMedal(gained);
  }
}

/** 结算未结算的全勤周（启动与每次打卡后调用；从最早未结算周循环到上一周） */
function settleWeekIfDue() {
  const prevStart = addDays(mondayOf(todayStr()), -7); // 上一周周一
  for (const start of pendingWeeks(settledWeek, prevStart)) {
    const end = addDays(start, 6);
    const before = score;
    const after = settleWeek(logs, score, start, end);
    if (after !== before) {
      awardStars(WEEK_BONUS, todayStr());
      toast('🏆 上周全勤 +3 星光');
    }
    settledWeek = start; // 发奖后再标记，避免满勤判定失败却提前标记
  }
  Store.save(SETTLED_KEY, settledWeek);
}

/* ---------- 勋章庆祝动画（全屏） ---------- */
function celebrateMedal(n) {
  // 清理残留庆祝层，避免快速连续触发叠加
  document.querySelectorAll('.celebrate').forEach((el) => el.remove());
  const overlay = document.createElement('div');
  overlay.className = 'celebrate';
  const emojis = ['🎖️', '⭐', '✨', '🎉'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.className = 'celebrate-item';
    s.textContent = emojis[i % emojis.length];
    s.style.left = Math.random() * 96 + 2 + '%';
    s.style.animationDelay = Math.random() * 1.2 + 's';
    s.style.fontSize = 22 + Math.random() * 26 + 'px';
    overlay.appendChild(s);
  }
  const badge = document.createElement('div');
  badge.className = 'celebrate-badge';
  badge.textContent = `🎖️ 获得勋章 ×${n}`;
  overlay.appendChild(badge);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2600);
  // 延后播报，避免被打卡后的即时语音覆盖（勋章庆祝优先级最高）
  setTimeout(() => Speak.zh(`太棒了！获得 ${n} 枚勋章！`), 600);
}

/** 今日是否已打卡某任务 */
function hasCheckinToday(subject, item) {
  return hasCheckin(logs, todayStr(), subject, item);
}

/* ---------- 周计划（生成/复习抽查/今日任务） ---------- */

/** 从打卡记录推导各科已学 id */
function learnedIds() {
  const bySubject = { poems: [], words: [], books: [] };
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && bySubject[l.subject] && !bySubject[l.subject].includes(l.item)) {
      bySubject[l.subject].push(l.item);
    }
  }
  return bySubject;
}

/** 识字已学映射：{ 字 id: 首次学习日期 }（用于间隔复习） */
function learnedWordMap() {
  const map = {};
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.subject === 'words' && l.item && !(l.item in map)) {
      map[l.item] = l.date;
    }
  }
  return map;
}

/** 数学进度：{ 阶段 id: [已完成的游戏 id] }（从打卡记录推导） */
function mathProgress() {
  const doneGames = {};
  for (const l of Array.isArray(logs) ? logs : []) {
    if (l && l.subject === 'math' && l.item) {
      const st = gameStage(l.item);
      if (st !== null) {
        const arr = (doneGames[st] = doneGames[st] || []);
        if (!arr.includes(l.item)) arr.push(l.item);
      }
    }
  }
  return doneGames;
}

/** 确保本周计划已生成；周日生成/刷新复习抽查（当天固定） */
function ensureWeekPlan() {
  const today = todayStr();
  const monday = mondayOf(today);
  if (!weekPlan || weekPlan.weekStart !== monday) {
    weekPlan = buildWeekPlan(monday, WEEK_COUNTS, CONTENT_POOL, learnedIds());
    delete weekPlan.reviewPoems; // 换周清除旧复习抽查
    delete weekPlan.reviewDate;
    Store.save(WEEK_PLAN_KEY, weekPlan);
  }
  if (isSunday(today) && (!weekPlan.reviewPoems || weekPlan.reviewDate !== today)) {
    weekPlan.reviewPoems = pickPoemReview(weekPlan.poems, learnedIds().poems, 2);
    weekPlan.reviewDate = today;
    Store.save(WEEK_PLAN_KEY, weekPlan);
  }
}

/* ---------- 飘星动画 ---------- */
function starFly(x, y, n = 1) {
  const s = document.createElement('div');
  s.className = 'star-fly';
  s.textContent = '⭐+' + n;
  s.style.left = x + 'px';
  s.style.top = y + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1200);
}

/** 从指定元素位置飘星 */
function starFlyAt(el) {
  const rect = el.getBoundingClientRect();
  starFly(rect.left + rect.width / 2, rect.top, 1);
}

/* ---------- 宠物进食动画（轻量版；完整宠物系统在 ticket 09） ---------- */
function feedPet() {
  const food = document.createElement('div');
  food.className = 'food-fly';
  food.textContent = '🍎';
  food.style.left = '50%';
  document.body.appendChild(food);
  setTimeout(() => food.remove(), 1200);
}

/* ---------- 板块视图分发 ---------- */
function renderBoard() {
  const r = BOARD_RENDERERS[activeBoard];
  if (!r) {
    renderBoardPlaceholder();
    return;
  }
  // 重新进入板块时重置板块内部状态（回到板块入口视图）
  if (r.reset) r.reset();
  r.render(view, {
    speak: (t) => Speak.zh(t),
    toast,
    starFlyAt,
    feedPet,
    checkin,
    hasCheckin: hasCheckinToday,
    getStars: () => score,
    getMedals: () => medals,
    getReviewPoems: () => (weekPlan && weekPlan.reviewPoems) || [],
    isReviewDay: () => isSunday(todayStr()),
    today: todayStr,
    getWeekWords: () => (weekPlan && weekPlan.words) || [],
    getLearnedWords: learnedWordMap,
    getMathProgress: mathProgress,
    go,
  });
}
/* ---------- 视图渲染入口 ---------- */
function render() {
  Speak.stop();
  clearInterval(lockTimer);
  lockTimer = null;
  gateInput = '';
  view.innerHTML = '';
  view.setAttribute('data-speak', '');
  if (currentView === 'home') renderHome();
  else if (currentView === 'gate') renderGate(false);
  else if (currentView === 'setpwd') renderGate(true);
  else if (currentView === 'parent') renderParent();
  else if (currentView === 'board') renderBoard();
  view.scrollTop = 0;
}

function go(next, boardKey) {
  if (boardKey !== undefined) activeBoard = boardKey;
  currentView = next;
  render();
}

/* ---------- 儿童模式：首页 ---------- */
function renderHome() {
  ensureWeekPlan(); // 确保本周计划已生成（含周日复习抽查）
  const today = todayStr();
  const targets = dailyTargets(today, weekPlan);
  const done = targets.filter((t) => hasCheckinToday(t.subject, t.item)).length;
  const total = targets.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const reviewDay = isSunday(today);

  view.setAttribute('data-speak', '柠柠，今天想玩什么呀？');
  const cards = BOARDS.map(
    (b) => `
      <button class="tile ${b.color}" data-board="${b.key}" aria-label="进入${b.name}板块">
        <span class="tile-ico">${b.ico}</span>
        <span>${b.name}</span>
        <span class="tile-desc">${b.desc}</span>
      </button>`
  ).join('');

  view.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🌈 柠柠，今天想玩什么呀？</div>
        <div class="greet-sub">点一点大卡片，开始今天的快乐学习</div>
      </div>
      <div class="topbar-right">
        <span class="score-pill"><span class="star">⭐</span><span id="scoreNum">${Number(score) || 0}</span></span>
        <button class="pet-avatar" id="petBtn" aria-label="我的宠物">🦖</button>
      </div>
    </header>
    ${reviewDay ? '<div class="review-banner">🔁 今天是古诗复习日，背一背学过的诗吧！</div>' : ''}
    <div class="progress-card">
      <div class="progress-head">
        <span>📖 今日任务</span>
        <span class="progress-num">${done} / ${total}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      ${total === 0 ? '<p class="desc">今天没有待办任务，休息一下吧～</p>' : ''}
    </div>
    <div class="grid-6">${cards}</div>
    <p class="hint">✨ 完成打卡得星光，集齐星星换勋章！</p>
    <button class="btn-big ghost" id="parentGate">🔐 家长入口</button>
  `;

  view.querySelectorAll('[data-board]').forEach((el) => {
    el.addEventListener('click', () => {
      const b = BOARDS.find((x) => x.key === el.dataset.board);
      if (!BOARD_RENDERERS[b.key]) {
        Speak.zh(`${b.name}板块，正在准备中，敬请期待`);
      }
      go('board', b.key);
    });
  });

  document.getElementById('petBtn').addEventListener('click', () => {
    Speak.zh('宠物在睡觉，后面的版本会醒过来哦');
    toast('🦖 宠物在睡觉～后面的版本会醒过来');
  });

  document.getElementById('parentGate').addEventListener('click', () => {
    gateInput = '';
    go('gate');
  });
}

/* ---------- 家长门禁（isSet: 首次强制设置新密码） ---------- */
function renderGate(isSet) {
  const title = isSet ? '🔐 设置新密码' : '🔐 家长模式';
  const hint = isSet
    ? '第一次使用，请设置 4 位数字密码'
    : '请输入 4 位数字密码';

  view.setAttribute('data-speak', title + '，' + hint);
  view.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">${title}</div>
        <div class="greet-sub" id="gateHint">${hint}</div>
      </div>
      <button class="btn-back" id="gateBack">🏠 返回</button>
    </header>
    <div class="keypad-wrap">
      <div class="keypad-display" id="gateDisplay"></div>
      <div class="keypad" id="keypad"></div>
      <div class="keypad-actions">
        <button class="btn-big ghost" id="gateClear">清除</button>
        <button class="btn-big" id="gateOk">确认</button>
      </div>
      <p class="hint" id="gateMsg"></p>
    </div>
  `;

  const display = document.getElementById('gateDisplay');
  const msg = document.getElementById('gateMsg');

  const updateDisplay = () => {
    display.textContent = '●'.repeat(gateInput.length) + '＿'.repeat(Math.max(0, 4 - gateInput.length));
  };
  updateDisplay();

  const keypad = document.getElementById('keypad');
  ['1','2','3','4','5','6','7','8','9','','0','⌫'].forEach((k) => {
    const btn = document.createElement('button');
    btn.className = 'key' + (k === '' ? ' func' : '');
    btn.textContent = k === '' ? '🔒' : k;
    if (k === '') {
      btn.style.visibility = 'hidden';
    } else if (k === '⌫') {
      btn.addEventListener('click', () => {
        gateInput = gateInput.slice(0, -1);
        updateDisplay();
      });
    } else {
      btn.addEventListener('click', () => {
        if (gateInput.length < 4) {
          gateInput += k;
          updateDisplay();
          if (gateInput.length === 4) autoSubmit();
        }
      });
    }
    keypad.appendChild(btn);
  });

  document.getElementById('gateClear').addEventListener('click', () => {
    gateInput = '';
    updateDisplay();
    msg.textContent = '';
  });

  document.getElementById('gateOk').addEventListener('click', autoSubmit);

  document.getElementById('gateBack').addEventListener('click', () => {
    Speak.stop();
    go('home');
  });

  // 若进入时仍处于锁定状态（上次退出时锁定期未过），立即禁用键盘并显示倒计时
  if (isLocked(settings, Date.now())) {
    startLockCountdown();
  }

  function autoSubmit() {
    if (gateInput.length !== 4) return;
    if (isLocked(settings, Date.now())) {
      startLockCountdown();
      return;
    }
    if (isSet) {
      const r = changePassword(gateInput, settings);
      if (!r.ok) {
        msg.textContent = r.reason === 'same-as-default'
          ? '请设置与 0000 不同的密码'
          : '密码需为 4 位数字';
        Speak.zh('请设置一个不同的 4 位数字密码');
        gateInput = '';
        updateDisplay();
        return;
      }
      settings = r.state;
      Store.save(SETTINGS_KEY, settings);
      msg.textContent = '✅ 密码设置成功';
      toast('密码设置成功');
      gateInput = '';
      go('parent');
      return;
    }
    const r = verify(gateInput, settings, Date.now());
    settings = r.state;
    Store.save(SETTINGS_KEY, settings);
    gateInput = '';
    updateDisplay();
    if (!r.ok) {
      if (r.reason === 'locked' || r.state.lockedUntil > Date.now()) {
        msg.textContent = '输错次数太多，请稍后再试';
        startLockCountdown();
      } else {
        const left = Math.max(0, 3 - r.state.attempts);
        msg.textContent = `密码不对，还能再试 ${left} 次`;
        Speak.zh(`密码不对，还能再试 ${left} 次`);
      }
      return;
    }
    // 验证通过：若仍是默认密码（从未设置过）→ 强制设置新密码
    if (settings.password === DEFAULT_PASSWORD) {
      msg.textContent = '首次使用，请设置新密码';
      go('setpwd');
    } else {
      go('parent');
    }
  }

  function startLockCountdown() {
    const until = settings.lockedUntil;
    disableKeys(true);
    const tick = () => {
      const remain = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      if (remain <= 0) {
        clearInterval(lockTimer);
        disableKeys(false);
        msg.textContent = '';
        return;
      }
      msg.textContent = `输错次数太多，请 ${remain} 秒后再试`;
    };
    tick();
    clearInterval(lockTimer);
    lockTimer = setInterval(tick, 1000);
  }

  function disableKeys(disabled) {
    keypad.querySelectorAll('.key').forEach((k) => {
      k.disabled = disabled;
      k.style.opacity = disabled ? 0.4 : 1;
    });
    document.getElementById('gateOk').disabled = disabled;
    document.getElementById('gateClear').disabled = disabled;
  }
}

/* ---------- 家长模式：后台框架（10/11 填充具体功能） ---------- */
function renderParent() {
  view.setAttribute('data-speak', '家长后台');
  view.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">📊 家长后台</div>
        <div class="greet-sub">密码已开启，数据安全有保障</div>
      </div>
      <button class="btn-back" id="parentBack">🏠 返回</button>
    </header>
    <div class="panel-card">
      <h3>🔐 家长密码 <span class="badge">已开启</span></h3>
      <p class="desc">当前使用 4 位数字密码保护家长后台，孩子无法进入。</p>
    </div>
    <div class="panel-card">
      <h3>📅 数据看板 <span class="badge">建设中</span></h3>
      <p class="desc">打卡日历、各科进度、宠物成长、勋章记录——即将上线。</p>
    </div>
    <div class="panel-card">
      <h3>⚙️ 自定义设置 <span class="badge">建设中</span></h3>
      <p class="desc">调整每周任务量、勋章兑换规则、孩子昵称与宠物主题。</p>
    </div>
    <div class="panel-card">
      <h3>📋 每日学习报告 <span class="badge">建设中</span></h3>
      <p class="desc">每天自动生成学习总结与明日计划。</p>
    </div>
    <div class="panel-card">
      <h3>🎁 勋章兑换 <span class="badge">建设中</span></h3>
      <p class="desc">孩子攒够勋章后，由家长在这里确认发放奖励。</p>
    </div>
    <button class="btn-big pink" id="parentToHome">🎈 回到儿童模式</button>
  `;

  document.getElementById('parentBack').addEventListener('click', () => go('home'));
  document.getElementById('parentToHome').addEventListener('click', () => go('home'));
}

/* ---------- 板块占位视图 ---------- */
function renderBoardPlaceholder() {
  const b = BOARDS.find((x) => x.key === activeBoard) || BOARDS[0];
  view.setAttribute('data-speak', `${b.name}板块正在准备中`);
  view.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">${b.ico} ${b.name}</div>
        <div class="greet-sub">${b.desc}</div>
      </div>
      <button class="btn-back" id="boardBack">🏠 返回</button>
    </header>
    <div class="empty">
      <span class="big">🧸</span>
      ${b.name}板块正在准备中<br>很快就能玩啦！
    </div>
  `;
  document.getElementById('boardBack').addEventListener('click', () => go('home'));
}

/* ---------- 全局小喇叭 ---------- */
function bindSpeak() {
  const btn = document.getElementById('btnSpeak');
  btn.addEventListener('click', () => {
    const txt = (view.getAttribute('data-speak') || '').trim();
    if (!txt) return;
    Speak.zh(txt);
    btn.classList.add('speaking');
    setTimeout(() => btn.classList.remove('speaking'), 1800);
  });
}

/* ---------- 启动 ---------- */
function init() {
  Speak.init();
  bindSpeak();
  // 注册 Service Worker：全量预缓存，安装后断网可用
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  // 启动时结算上一周全勤（若满勤 +3 星光）
  settleWeekIfDue();
  // 自动语音问候（若被浏览器拦截，用户可点全局小喇叭）
  setTimeout(() => Speak.zh('柠柠，今天想玩什么呀？'), 400);
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
