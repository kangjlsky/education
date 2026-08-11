/* =========================================================
   柠柠学习工作台 - Service Worker
   策略：安装时全量预缓存（离线可用）+ 运行时缓存优先、
   后台更新（stale-while-revalidate），新增静态资源
   首次联网访问后自动进入缓存，之后断网可用。
   ========================================================= */

const CACHE = 'ning-v3';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/core/password.js',
  './js/core/stars.js',
  './js/core/dates.js',
  './js/core/medals.js',
  './js/core/attendance.js',
  './js/boards/poems.js',
  './js/boards/medals.js',
  './js/data/poems.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  // 仅处理同源 GET 请求（精确匹配 origin，防止前缀伪造）
  let sameOrigin = false;
  try {
    sameOrigin = new URL(request.url).origin === self.location.origin;
  } catch {
    return;
  }
  if (!sameOrigin) return;

  e.respondWith(
    caches.match(request).then((hit) => {
      // 后台尝试更新缓存（网络失败时静默使用已缓存副本）
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
