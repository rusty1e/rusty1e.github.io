(() => {
  let fx = null;
  let booting = false;

  // 如果你的博客部署在子路径，比如 /blog/ ，把这里改成 '/blog/'
  const SITE_ROOT = '/';

  function normalizePath(path) {
    if (!path) return '/';
    path = path.split('?')[0].split('#')[0];
    if (!path.startsWith('/')) path = '/' + path;
    return path.replace(/\/+$/, '') || '/';
  }

  function isHomePage() {
    const current = normalizePath(window.location.pathname);
    const root = normalizePath(SITE_ROOT);

    return current === root || current === root + '/index.html';
  }

  function ensureCanvas() {
    let wrap = document.getElementById('raindrop-wrap');
    let canvas = document.getElementById('raindrop-canvas');

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'raindrop-wrap';
      document.body.appendChild(wrap);
    }

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'raindrop-canvas';
      wrap.appendChild(canvas);
    }

    return canvas;
  }

  function getWrap() {
    return document.getElementById('raindrop-wrap');
  }

  function hideWrapCompletely() {
    const wrap = getWrap();
    if (!wrap) return;
    wrap.style.opacity = '0';
    wrap.style.visibility = 'hidden';
    wrap.style.display = 'none';
    wrap.style.pointerEvents = 'none';
  }

  function showWrap() {
    const wrap = getWrap();
    if (!wrap) return;
    wrap.style.display = '';
    wrap.style.pointerEvents = 'none';
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    if (fx) fx.resize(width, height);
  }

  function findContentStart() {
    const selectors = [
      '#recent-posts',
      '#post',
      '#article-container',
      'main.layout',
      'main',
      'article'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return null;
  }

  function shouldHideEffect() {
    if (!isHomePage()) return true;

    const target = findContentStart();
    if (!target) return false;

    const nav = document.getElementById('nav');
    const navOffset = nav ? nav.offsetHeight + 500 : 560;

    return target.getBoundingClientRect().top <= navOffset;
  }

  function applyEffectVisibility() {
    const wrap = getWrap();
    if (!wrap) return;

    // 非首页：彻底不显示
    if (!isHomePage()) {
      document.body.classList.add('raindrop-hidden');
      hideWrapCompletely();
      return;
    }

    showWrap();

    const hidden = shouldHideEffect();
    document.body.classList.toggle('raindrop-hidden', hidden);

    if (hidden) {
      wrap.style.opacity = '0';
      wrap.style.visibility = 'hidden';
    } else {
      wrap.style.opacity = '1';
      wrap.style.visibility = 'visible';
    }

    wrap.style.pointerEvents = 'none';
  }

  async function initRaindrop() {
    if (booting || fx) return;
    if (!isHomePage()) {
      hideWrapCompletely();
      return;
    }
    if (typeof RaindropFX === 'undefined') return;
    if (typeof WebGL2RenderingContext === 'undefined') return;

    booting = true;

    try {
      const canvas = ensureCanvas();
      showWrap();
      resizeCanvas(canvas);

      fx = new RaindropFX({
        canvas,
        spawnInterval: [0.12, 0.28],
        spawnSize: [80, 170],
        spawnLimit: 220,
        slipRate: 0.96,
        gravity: 2200,
        trailDropDensity: 0.18,
        trailDropSize: [0.32, 0.48],
        trailDistance: [14, 26],
        trailSpread: 0.48,
        initialSpread: 0.5,
        shrinkRate: 0.015,
        velocitySpread: 0.28,
        backgroundBlurSteps: 1,
        mist: false,
        dropletsPerSeconds: 0
      });

      await fx.setBackground('/image/background.jpg');
      await fx.start();

      applyEffectVisibility();
    } catch (err) {
      console.error('[raindrop] init failed:', err);
    } finally {
      booting = false;
    }
  }

  function onResize() {
    if (!isHomePage()) {
      applyEffectVisibility();
      return;
    }

    const canvas = document.getElementById('raindrop-canvas');
    if (canvas) resizeCanvas(canvas);
    applyEffectVisibility();
  }

  function onScroll() {
    applyEffectVisibility();
  }

  function boot() {
    ensureCanvas();

    if (isHomePage()) {
      initRaindrop();
    } else {
      applyEffectVisibility();
    }

    requestAnimationFrame(() => {
      onResize();
      onScroll();
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('pjax:complete', boot);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll, { passive: true });

  boot();
})();