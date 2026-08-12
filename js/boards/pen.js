/* =========================================================
   控笔板块：Canvas 描红（手指描画 → 覆盖判定 → 打卡）
   ctx 注入：speak/toast/starFlyAt/feedPet/checkin/hasCheckin/
            go/today/getPenLearned
   ========================================================= */

import { PEN_CHARS } from '../data/pen.js';
import { isComplete, addSegmentToSet } from '../core/pen.js';

let mode = 'main';      // main | draw
let activePenId = null;
let penSession = null;  // { shapeSet, drawnSet, complete, checked }

/** 重置板块内部状态 */
export function resetPen() {
  mode = 'main';
  activePenId = null;
  penSession = null;
}

export function renderPen(container, ctx) {
  if (mode === 'draw') renderDraw(container, ctx);
  else renderMain(container, ctx);
}

/* ---------- 主视图：今日描红任务 ---------- */
function renderMain(container, ctx) {
  const today = ctx.today();
  const learned = ctx.getPenLearned() || [];
  const penPerDay = ctx.getPenDaily ? ctx.getPenDaily() : 2;
  // 未学锚定 + 今日已打卡保留
  const fresh = PEN_CHARS.filter((p) => !learned.includes(p.id)).slice(0, penPerDay);
  const doneToday = PEN_CHARS.filter((p) => ctx.hasCheckin('pen', p.id));
  const shown = [...fresh, ...doneToday.filter((p) => !fresh.includes(p))];

  const cards = shown
    .map((p) => {
      const done = ctx.hasCheckin('pen', p.id);
      return `
      <button class="pen-card" data-pen="${p.id}">
        <span class="pen-char">${p.char}</span>
        <span class="pen-info">
          <span class="pen-level">${p.level === 1 ? '🔢 数字' : '🖋️ 汉字'}</span>
          <span class="pen-hint">${done ? '已打卡' : '描一描，写一写'}</span>
        </span>
        <span class="pen-status${done ? ' done' : ''}">${done ? '🌸' : '✍️ 开始'}</span>
      </button>`;
    })
    .join('');

  container.setAttribute('data-speak', `控笔，今天描 ${penPerDay} 个字`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🖍️ 控笔</div>
        <div class="greet-sub">今天描 ${penPerDay} 个字，练练小手</div>
      </div>
      <button class="btn-back" id="penBack">🏠 返回</button>
    </header>
    ${cards || '<p class="desc" style="text-align:center;margin:30px 0;">今天的描红都完成啦！</p>'}
    <p class="hint">✨ 用手指沿着虚线把字描满，就能打卡得星光</p>
  `;

  container.querySelectorAll('[data-pen]').forEach((el) => {
    el.addEventListener('click', () => {
      activePenId = el.dataset.pen;
      mode = 'draw';
      renderDraw(container, ctx);
    });
  });
  document.getElementById('penBack').addEventListener('click', () => ctx.go('home'));
}

/* ---------- 描红视图（Canvas） ---------- */
function renderDraw(container, ctx) {
  const pen = PEN_CHARS.find((p) => p.id === activePenId);
  if (!pen) {
    mode = 'main';
    renderPen(container, ctx);
    return;
  }
  const checked = ctx.hasCheckin('pen', pen.id);

  container.setAttribute('data-speak', `描 ${pen.char}`);
  container.innerHTML = `
    <header class="topbar">
      <div>
        <div class="greet">🖍️ 描一描</div>
        <div class="greet-sub">沿着淡色的字描满，像这样 ✍️</div>
      </div>
      <button class="btn-back" id="drawBack">⬅️ 返回</button>
    </header>
    <div class="pen-canvas-wrap">
      <canvas class="pen-canvas" id="penCanvas" width="300" height="300"></canvas>
      <div class="pen-complete" id="penComplete" hidden>
        <div class="pc-emoji">🎉</div>
        <div class="pc-text">写得真棒！</div>
      </div>
    </div>
    <div class="pen-actions">
      ${checked ? '' : '<button class="btn-big ghost" id="penClear">🧽 清除重画</button>'}
      ${
        checked
          ? '<button class="btn-big ghost" disabled>🌸 今天已打卡</button>'
          : '<button class="btn-big pink" id="penCheckin" hidden>🎖️ 完成打卡 +1 星光</button>'
      }
    </div>
  `;

  const canvas = document.getElementById('penCanvas');
  const g = canvas.getContext('2d');
  const completeLayer = document.getElementById('penComplete');
  const checkinBtn = document.getElementById('penCheckin');

  // 进入描红总是重建会话：
  // - 今天已打卡的字 → 直接显示完成态
  // - 未打卡的字 → 全新空白（避免上次 complete 残留导致"没描就显示写得真棒"）
  penSession = {
    penId: pen.id,
    shapeSet: extractShape(canvas, g, pen.char),
    drawnSet: new Set(),
    complete: checked,
  };

  drawBase(canvas, g, pen.char);
  if (penSession.complete) {
    showComplete(completeLayer, checkinBtn, checked);
  }

  // 绘制笔迹（触摸/鼠标）
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  const strokeLine = (x0, y0, x1, y1) => {
    g.strokeStyle = '#4BA7CA';
    g.lineWidth = 10;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    // 采样点偶化对齐字形网格，写入判定集合
    addSegmentToSet(penSession.drawnSet, x0, y0, x1, y1);
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (penSession.complete || checked) return;
    drawing = true;
    const r = canvas.getBoundingClientRect();
    lastX = e.clientX - r.left;
    lastY = e.clientY - r.top;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    strokeLine(lastX, lastY, x, y);
    lastX = x;
    lastY = y;
    if (!penSession.complete && isComplete(penSession.shapeSet, penSession.drawnSet)) {
      penSession.complete = true;
      ctx.speak('写得真棒！');
      showComplete(completeLayer, checkinBtn, false);
    }
  });

  const endDraw = () => {
    drawing = false;
  };
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);

  const clearBtn = document.getElementById('penClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      penSession.drawnSet = new Set();
      penSession.complete = false;
      completeLayer.hidden = true;
      if (checkinBtn) checkinBtn.hidden = true;
      drawBase(canvas, g, pen.char);
    });
  }

  if (checkinBtn) {
    checkinBtn.addEventListener('click', () => {
      const r = ctx.checkin('pen', pen.id);
      if (r.ok) {
        ctx.starFlyAt(checkinBtn);
        ctx.feedPet();
        ctx.speak('太棒啦！描红完成，获得一颗星光！');
        ctx.toast('⭐ +1 星光');
        renderDraw(container, ctx);
      } else {
        ctx.toast('今天这个字已打卡啦');
      }
    });
  }

  document.getElementById('drawBack').addEventListener('click', () => {
    mode = 'main';
    renderPen(container, ctx);
  });
}

/* ---------- Canvas 辅助 ---------- */

/** 渲染底字（浅灰大号字） */
function drawBase(canvas, g, char) {
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = '#e3eaee';
  g.font = `bold ${Math.floor(canvas.height * 0.5)}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(char, canvas.width / 2, canvas.height / 2);
}

/** 提取字形像素集合（离屏渲染后读取 alpha > 128 的像素） */
function extractShape(canvas, g, char) {
  // 先用底字样式渲染到主画布读取
  drawBase(canvas, g, char);
  const { data, width, height } = g.getImageData(0, 0, canvas.width, canvas.height);
  const shape = new Set();
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 128) shape.add(`${x},${y}`);
    }
  }
  // 提取后清空，避免残留底字
  g.clearRect(0, 0, canvas.width, canvas.height);
  return shape;
}

function showComplete(completeLayer, checkinBtn, checked) {
  completeLayer.hidden = false;
  if (checkinBtn && !checked) checkinBtn.hidden = false;
}
