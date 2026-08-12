/* =========================================================
   家长后台视图（导航 + 数据看板 + 每日报告 + 设置/兑换/备份）
   ctx 注入：getLogs/getScore/getMedals/getWeekPlan/
            speak/toast/go（设置/兑换/备份在 ticket 11 增加 saveKey 等）
   ========================================================= */

import { POEMS } from './data/poems.js';
import { WORDS } from './data/words.js';
import { ENGLISH_WORDS, ENGLISH_BOOKS } from './data/english.js';
import { PEN_CHARS } from './data/pen.js';
import { MATH_STAGES } from './data/math.js';
import { monthDays, fullWeeksInMonth, last7Days, subjectProgress, buildDailyReport } from './core/dashboard.js';
import { medalsAvailable } from './core/medals.js';
import { petLevel, levelProgress } from './core/pet.js';
import { addDays } from './core/dates.js';

const mathGameTotal = MATH_STAGES.reduce((s, st) => s + st.games.length, 0); // 数学游戏总数（当前 2 个）

let view = 'home'; // home | dashboard | report | settings | redeem | backup

/** 重置家长后台子视图（返回导航） */
export function resetParent() {
  view = 'home';
}

export function renderParent(container, ctx) {
  if (view === 'dashboard') renderDashboard(container, ctx);
  else if (view === 'report') renderReport(container, ctx);
  else if (view === 'settings') renderSettings(container, ctx);
  else if (view === 'redeem') renderRedeem(container, ctx);
  else if (view === 'backup') renderBackup(container, ctx);
  else renderHome(container, ctx);
}

/* ---------- 导航首页 ---------- */
function renderHome(container, ctx) {
  container.setAttribute('data-speak', '家长后台');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">📊 家长后台</div>
        <div class="greet-sub">密码已开启，数据安全有保障</div>
      </div>
      <button class="btn-back" id="parentBack">🏠 返回</button>
    </header>
    <button class="menu-card" data-view="dashboard">
      <span class="mc-ico">📅</span>
      <span class="mc-name">数据看板</span>
      <span class="mc-desc">打卡日历 · 各科进度 · 宠物 · 勋章</span>
      <span class="mc-arrow">›</span>
    </button>
    <button class="menu-card" data-view="report">
      <span class="mc-ico">📋</span>
      <span class="mc-name">每日学习报告</span>
      <span class="mc-desc">今日打卡 · 星光 · 勋章变化 · 明日预告</span>
      <span class="mc-arrow">›</span>
    </button>
    <button class="menu-card" data-view="settings">
      <span class="mc-ico">⚙️</span>
      <span class="mc-name">自定义设置</span>
      <span class="mc-desc">任务量 · 兑换规则 · 昵称 · 密码</span>
      <span class="mc-arrow">›</span>
    </button>
    <button class="menu-card" data-view="redeem">
      <span class="mc-ico">🎁</span>
      <span class="mc-name">勋章兑换</span>
      <span class="mc-desc">确认孩子的兑换申请</span>
      <span class="mc-arrow">›</span>
    </button>
    <button class="menu-card" data-view="backup">
      <span class="mc-ico">💾</span>
      <span class="mc-name">数据备份</span>
      <span class="mc-desc">导出 / 导入 JSON 备份</span>
      <span class="mc-arrow">›</span>
    </button>
  `;

  container.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', () => {
      view = el.dataset.view;
      renderParent(container, ctx);
    });
  });
  document.getElementById('parentBack').addEventListener('click', () => ctx.go('home'));
}

/* ---------- 数据看板 ---------- */
function renderDashboard(container, ctx) {
  const logs = ctx.getLogs();
  const stars = ctx.getScore();
  const medals = ctx.getMedals() || { redeemed: 0, history: [] };
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const doneDays = monthDays(logs, year, month);
  const fullWeeks = fullWeeksInMonth(logs, year, month);
  const bars = last7Days(logs, today);
  const maxBar = Math.max(1, ...bars.map((b) => b.count));

  // 月历网格
  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7; // 周一开头
  const daysInMonth = new Date(year, month, 0).getDate();
  let cells = '<div class="cal-head"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="cal-grid">';
  for (let i = 0; i < lead; i += 1) cells += '<span class="cal-empty"></span>';
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isDone = doneDays.has(ds);
    const inFullWeek = fullWeeks.some((w) => {
      const end = addDays(w, 6);
      return ds >= w && ds <= end;
    });
    cells += `<span class="cal-cell${isDone ? ' done' : ''}${inFullWeek ? ' fullweek' : ''}${ds === today ? ' today' : ''}">${d}</span>`;
  }
  cells += '</div>';

  // 各科进度
  const subjects = [
    { name: '📖 国学', logs: 'poems', total: POEMS.length },
    { name: '✏️ 识字', logs: 'words', total: WORDS.length },
    { name: '🔠 英语', logs: 'english', total: ENGLISH_WORDS.length + ENGLISH_BOOKS.length },
    { name: '🖍️ 控笔', logs: 'pen', total: PEN_CHARS.length },
    { name: '🔢 数学', logs: 'math', total: mathGameTotal },
  ];
  const subjectRows = subjects
    .map((s) => {
      const p = subjectProgress(logs, s.logs, s.total);
      const pct = s.total ? Math.round((p.done / s.total) * 100) : 0;
      return `
      <div class="subject-row">
        <span class="sub-name">${s.name}</span>
        <div class="sub-track"><div class="sub-fill" style="width:${pct}%"></div></div>
        <span class="sub-num">${p.done}/${s.total}</span>
      </div>`;
    })
    .join('');

  // 宠物 + 勋章摘要
  const level = petLevel(stars);
  const petPct = Math.round(levelProgress(stars) * 100);
  const medalCount = medalsAvailable(stars, medals.redeemed);

  container.setAttribute('data-speak', '数据看板');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">📅 数据看板</div>
        <div class="greet-sub">${year} 年 ${month} 月</div>
      </div>
      <button class="btn-back" id="dashBack">⬅️ 返回</button>
    </header>
    <div class="panel-card">
      <h3>🗓️ 打卡日历</h3>
      ${cells}
      <p class="desc">🌸 已打卡 · 🏆 全勤周（满 5 天）</p>
    </div>
    <div class="panel-card">
      <h3>📈 近 7 天打卡</h3>
      <div class="bar-chart">
        ${bars
          .map(
            (b) => `
          <div class="bar-col">
            <div class="bar-val">${b.count || ''}</div>
            <div class="bar-fill" style="height:${Math.max(4, (b.count / maxBar) * 70)}px"></div>
            <div class="bar-label">${b.date.slice(8)}</div>
          </div>`
          )
          .join('')}
      </div>
    </div>
    <div class="panel-card">
      <h3>📚 各科进度</h3>
      ${subjectRows}
    </div>
    <div class="panel-card">
      <h3>🐾 宠物与勋章</h3>
      <div class="sub-row-2">
        <span>宠物 Lv.${level}</span>
        <div class="sub-track"><div class="sub-fill" style="width:${petPct}%"></div></div>
      </div>
      <p class="desc">当前勋章：🎖️ ${medalCount} 枚</p>
    </div>
  `;

  document.getElementById('dashBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

/* ---------- 每日学习报告 ---------- */
function renderReport(container, ctx) {
  const logs = ctx.getLogs();
  const stars = ctx.getScore();
  const medals = ctx.getMedals() || { redeemed: 0, history: [] };
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const r = buildDailyReport(logs, stars, medals, today);

  const subjectNames = { poems: '📖 国学', words: '✏️ 识字', math: '🔢 数学', english: '🔠 英语', pen: '🖍️ 控笔' };
  // 仅渲染已知科目标签（未知值跳过，避免外部数据注入）
  const subjectTags = r.subjects
    .map((s) => subjectNames[s])
    .filter(Boolean)
    .map((name) => `<span class="tag">${name}</span>`)
    .join('');

  container.setAttribute('data-speak', '每日学习报告');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">📋 每日学习报告</div>
        <div class="greet-sub">${today}</div>
      </div>
      <button class="btn-back" id="reportBack">⬅️ 返回</button>
    </header>
    <div class="report-hero">
      <div class="report-summary">${r.summary}</div>
      <div class="report-stats">
        <div class="rs-item"><span class="rs-num">${r.count}</span><span class="rs-label">今日打卡</span></div>
        <div class="rs-item"><span class="rs-num">⭐${r.starsEarned}</span><span class="rs-label">获得星光</span></div>
        <div class="rs-item"><span class="rs-num">🎖️${r.medalsEarned}</span><span class="rs-label">获得勋章</span></div>
      </div>
    </div>
    <div class="panel-card">
      <h3>📚 今日学习科目</h3>
      ${subjectTags || '<p class="desc">今天还没有打卡记录</p>'}
    </div>
    <div class="panel-card">
      <h3>🔮 明日预告</h3>
      <p class="desc">明天（${r.tomorrow}）继续加油，坚持就是胜利！</p>
    </div>
  `;

  document.getElementById('reportBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

/* ---------- 设置 / 兑换 / 备份（ticket 11 填充） ---------- */
function renderSettings(container, ctx) {
  container.setAttribute('data-speak', '自定义设置');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">⚙️ 自定义设置</div>
        <div class="greet-sub">任务量 · 兑换规则 · 昵称 · 密码</div>
      </div>
      <button class="btn-back" id="settingsBack">⬅️ 返回</button>
    </header>
    <div class="empty"><span class="big">🧰</span>建设中，很快上线！</div>
  `;
  document.getElementById('settingsBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

function renderRedeem(container, ctx) {
  container.setAttribute('data-speak', '勋章兑换');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🎁 勋章兑换</div>
        <div class="greet-sub">确认孩子的兑换申请</div>
      </div>
      <button class="btn-back" id="redeemBack">⬅️ 返回</button>
    </header>
    <div class="empty"><span class="big">🎁</span>建设中，很快上线！</div>
  `;
  document.getElementById('redeemBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

function renderBackup(container, ctx) {
  container.setAttribute('data-speak', '数据备份');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">💾 数据备份</div>
        <div class="greet-sub">导出 / 导入 JSON 备份</div>
      </div>
      <button class="btn-back" id="backupBack">⬅️ 返回</button>
    </header>
    <div class="empty"><span class="big">💾</span>建设中，很快上线！</div>
  `;
  document.getElementById('backupBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}
