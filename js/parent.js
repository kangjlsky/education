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

/* ---------- 自定义设置 ---------- */
function renderSettings(container, ctx) {
  const cfg = ctx.getConfig();
  const weekly = cfg.weekly;

  container.setAttribute('data-speak', '自定义设置');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">⚙️ 自定义设置</div>
        <div class="greet-sub">修改后下周生效</div>
      </div>
      <button class="btn-back" id="settingsBack">⬅️ 返回</button>
    </header>
    <div class="panel-card">
      <h3>🧒 孩子信息</h3>
      <label class="form-label">昵称</label>
      <input class="form-input" id="setName" value="${esc(cfg.childName)}" maxlength="8">
      <label class="form-label">宠物主题</label>
      <select class="form-input" id="setTheme">
        <option value="dino" ${cfg.petTheme === 'dino' ? 'selected' : ''}>🦖 小恐龙</option>
        <option value="cat" ${cfg.petTheme === 'cat' ? 'selected' : ''}>🐱 小猫咪</option>
        <option value="dog" ${cfg.petTheme === 'dog' ? 'selected' : ''}>🐶 小狗狗</option>
      </select>
    </div>
    <div class="panel-card">
      <h3>📆 每周任务量</h3>
      <label class="form-label">每周古诗（首）</label>
      <input class="form-input" type="number" min="1" max="50" id="setPoems" value="${weekly.poems}">
      <label class="form-label">每周生字（个）</label>
      <input class="form-input" type="number" min="1" max="50" id="setWords" value="${weekly.words}">
      <label class="form-label">每周绘本（本）</label>
      <input class="form-input" type="number" min="1" max="50" id="setBooks" value="${weekly.books}">
      <label class="form-label">每日描红（个）</label>
      <input class="form-input" type="number" min="1" max="50" id="setPen" value="${weekly.penDaily}">
    </div>
    <div class="panel-card">
      <h3>🎁 勋章兑换档位</h3>
      ${cfg.redeem
        .map(
          (r, i) => `
        <div class="redeem-rule">
          <input class="form-input redeem-medals" type="number" min="1" max="99" value="${r.medals}" data-i="${i}">
          <span>枚 =</span>
          <input class="form-input redeem-reward" value="${esc(r.reward)}" maxlength="12" data-i="${i}">
        </div>`
        )
        .join('')}
    </div>
    <div class="panel-card">
      <h3>🔐 修改家长密码</h3>
      <input class="form-input" type="password" inputmode="numeric" maxlength="4" id="setNewPwd" placeholder="新密码（4 位数字）">
      <button class="btn-big ghost" id="setPwdBtn" style="margin-top:10px;">保存新密码</button>
    </div>
    <button class="btn-big pink" id="settingsSave">💾 保存全部设置</button>
  `;

  const collect = () => {
    const num = (id) => Number(document.getElementById(id).value) || 0;
    const redeem = Array.from(document.querySelectorAll('.redeem-medals')).map((el, i) => ({
      medals: Number(el.value) || 1,
      reward: document.querySelectorAll('.redeem-reward')[i].value.trim() || '小奖励',
    }));
    return {
      childName: document.getElementById('setName').value.trim() || '柠柠',
      petTheme: document.getElementById('setTheme').value,
      weekly: {
        poems: num('setPoems'),
        words: num('setWords'),
        books: num('setBooks'),
        penDaily: num('setPen'),
      },
      redeem,
    };
  };

  document.getElementById('settingsSave').addEventListener('click', () => {
    ctx.saveConfig(collect());
    ctx.toast('✅ 设置已保存，下周生效');
    ctx.speak('设置已保存');
  });

  document.getElementById('setPwdBtn').addEventListener('click', () => {
    const pwd = document.getElementById('setNewPwd').value;
    const r = ctx.changePassword(pwd);
    if (r.ok) {
      ctx.toast('✅ 密码已更新');
      document.getElementById('setNewPwd').value = '';
    } else if (r.reason === 'same-as-default') {
      ctx.toast('不能使用初始密码 0000');
    } else {
      ctx.toast('密码需为 4 位数字');
    }
  });

  document.getElementById('settingsBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

/* ---------- 勋章兑换确认 ---------- */
function renderRedeem(container, ctx) {
  const stars = ctx.getScore();
  const medals = ctx.getMedals() || { redeemed: 0, history: [], pending: [] };
  const cfg = ctx.getConfig();
  const avail = medalsAvailable(stars, medals.redeemed);
  const pending = Array.isArray(medals.pending) ? medals.pending : [];

  const pendingRows = pending
    .map(
      (p, i) => `
      <div class="redeem-pending">
        <span class="rp-info">🎖️ ${p.n} 枚 → ${esc(p.reward)}（${p.date}）</span>
        <span class="badge">等待家长确认</span>
        <div class="rp-actions">
          <button class="btn-big" data-confirm="${i}">✅ 确认发放</button>
          <button class="btn-big ghost" data-reject="${i}">✖️ 拒绝</button>
        </div>
      </div>`
    )
    .join('');

  container.setAttribute('data-speak', '勋章兑换');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🎁 勋章兑换</div>
        <div class="greet-sub">可用勋章：🎖️ ${avail} 枚</div>
      </div>
      <button class="btn-back" id="redeemBack">⬅️ 返回</button>
    </header>
    <div class="panel-card">
      <h3>📋 待确认申请</h3>
      ${pendingRows || '<p class="desc">暂无待确认的兑换申请。</p>'}
    </div>
    <div class="panel-card">
      <h3>💡 兑换档位</h3>
      ${cfg.redeem.map((r) => `<p class="desc">🎖️ ${r.medals} 枚 = ${esc(r.reward)}</p>`).join('')}
      <p class="desc">孩子攒够勋章后可申请兑换，家长在这里确认发放。</p>
    </div>
  `;

  container.querySelectorAll('[data-confirm]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = pending[Number(btn.dataset.confirm)];
      const r = ctx.confirmRedeem(p.id);
      if (r.ok) {
        ctx.toast('✅ 已确认发放');
        ctx.speak('已确认发放奖励');
      } else if (r.reason === 'insufficient') {
        ctx.toast('勋章不足，无法发放');
      }
      renderRedeem(container, ctx);
    });
  });
  container.querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = pending[Number(btn.dataset.reject)];
      ctx.rejectRedeem(p.id);
      ctx.toast('已拒绝该申请');
      renderRedeem(container, ctx);
    });
  });
  document.getElementById('redeemBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

/* ---------- 数据备份 ---------- */
function renderBackup(container, ctx) {
  container.setAttribute('data-speak', '数据备份');
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">💾 数据备份</div>
        <div class="greet-sub">导出备份 · 换机/清数据后导入恢复</div>
      </div>
      <button class="btn-back" id="backupBack">⬅️ 返回</button>
    </header>
    <div class="panel-card">
      <h3>📤 导出备份</h3>
      <p class="desc">下载包含全部学习进度、星光、勋章、设置的 JSON 文件。</p>
      <button class="btn-big" id="backupExport">📤 导出 JSON</button>
    </div>
    <div class="panel-card">
      <h3>📥 导入恢复</h3>
      <p class="desc">选择之前导出的备份文件，恢复后页面将自动刷新。</p>
      <label class="btn-big ghost" style="display:block;text-align:center;cursor:pointer;">📥 选择备份文件
        <input type="file" id="backupFile" accept=".json,application/json" hidden>
      </label>
    </div>
  `;

  document.getElementById('backupExport').addEventListener('click', () => {
    const json = ctx.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ning-backup-${todayLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ctx.toast('📤 备份已导出');
  });

  document.getElementById('backupFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = ctx.importBackup(String(reader.result));
      if (r.ok) {
        ctx.toast('✅ 恢复成功，正在刷新…');
        setTimeout(() => location.reload(), 800);
      } else {
        ctx.toast('❌ 备份文件无效');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('backupBack').addEventListener('click', () => {
    view = 'home';
    renderParent(container, ctx);
  });
}

/** 当前日期（备份文件名用） */
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** HTML 转义（设置表单回显等用户输入） */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
