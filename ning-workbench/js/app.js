/* =========================================================
   柠柠学习工作台 - 入口与核心逻辑（ES Module）
   Ticket 01：PWA 壳 + 儿童首页 + 家长门禁 + 导航框架
   后续板块（02-09）与家长后台（10-11）在此基础上扩展
   ========================================================= */

import { createState, verify, changePassword, isLocked, DEFAULT_PASSWORD } from './core/password.js';

/* ---------- 常量 ---------- */
const SETTINGS_KEY = 'ning.settings'; // 家长设置（含密码状态）
const SCORE_KEY = 'ning.stars';       // 星光总数

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
let score = Store.load(SCORE_KEY, 0);
let currentView = 'home';   // home | gate | setpwd | parent | board
let activeBoard = null;     // 占位视图当前板块
let gateInput = '';         // 密码输入缓冲区
let lockTimer = null;       // 锁定倒计时定时器

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
  else if (currentView === 'board') renderBoardPlaceholder();
  view.scrollTop = 0;
}

function go(next, boardKey) {
  if (boardKey !== undefined) activeBoard = boardKey;
  currentView = next;
  render();
}

/* ---------- 儿童模式：首页 ---------- */
function renderHome() {
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
    <div class="grid-6">${cards}</div>
    <p class="hint">✨ 完成打卡得星光，集齐星星换勋章！</p>
    <button class="btn-big ghost" id="parentGate">🔐 家长入口</button>
  `;

  view.querySelectorAll('[data-board]').forEach((el) => {
    el.addEventListener('click', () => {
      const b = BOARDS.find((x) => x.key === el.dataset.board);
      Speak.zh(`${b.name}板块，正在准备中，敬请期待`);
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
  // 自动语音问候（若被浏览器拦截，用户可点全局小喇叭）
  setTimeout(() => Speak.zh('柠柠，今天想玩什么呀？'), 400);
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
