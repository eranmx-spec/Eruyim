// הסצנה החיה בראש העמוד: אש שמרצדת, גחלים שעפות, עשן ואדים מהאוכל.
// כל הקואורדינטות הן בפיקסלים של התמונה המקורית (1370x1148).
(() => {
  const hero = document.querySelector('.hero');
  const scene = hero?.querySelector('.hero-scene');
  const canvas = scene?.querySelector('.scene-fire');
  if (!hero || !scene || !canvas?.getContext) return;

  const IMG_W = 1370;
  const IMG_H = 1148;
  const MOBILE = window.matchMedia('(max-width: 980px)');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const ctx = canvas.getContext('2d');

  // ממקם את הסצנה כמו background-size: cover במחשב, וכמו רוחב מלא בראש האזור בטלפון
  const layout = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    const scale = MOBILE.matches ? w / IMG_W : Math.max(w / IMG_W, h / IMG_H);
    const x = (w - IMG_W * scale) / 2;
    const y = MOBILE.matches ? 0 : (h - IMG_H * scale) / 2;
    scene.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  scene.classList.add('is-live');
  layout();
  window.addEventListener('resize', layout);
  MOBILE.addEventListener?.('change', layout);
  new ResizeObserver(layout).observe(hero);

  // מקורות האש: הלהבות שמעל הרשת והגחלים שמתחתיה
  const FLAMES = [
    { x0: 545, x1: 715, y: 725, h: 190, weight: 3 },
    { x0: 470, x1: 710, y: 910, h: 80, weight: 2 },
  ];
  const GRILL = { x0: 400, x1: 830, y: 760 };

  const rand = (a, b) => a + Math.random() * (b - a);
  const particles = [];

  const spawnFlame = () => {
    const src = Math.random() < 0.6 ? FLAMES[0] : FLAMES[1];
    const x = rand(src.x0, src.x1);
    const centre = (src.x0 + src.x1) / 2;
    particles.push({
      kind: 'flame', x, y: src.y + rand(-8, 8), vx: (centre - x) * 0.25 + rand(-12, 12), vy: -src.h * rand(1.2, 1.9),
      size: rand(28, 52) * (src === FLAMES[0] ? 1 : 0.8), life: 0, max: rand(0.45, 0.85),
    });
  };
  const spawnEmber = () => {
    particles.push({
      kind: 'ember', x: rand(560, 700), y: rand(680, 740), vx: rand(-35, 35), vy: rand(-170, -90),
      size: rand(2.2, 4.8), life: 0, max: rand(2.2, 4), phase: rand(0, Math.PI * 2),
    });
  };
  const spawnSmoke = () => {
    particles.push({
      kind: 'smoke', x: rand(540, 680), y: rand(600, 650), vx: rand(-6, 10), vy: rand(-38, -24),
      size: rand(30, 50), life: 0, max: rand(5, 8), phase: rand(0, Math.PI * 2),
    });
  };
  const spawnSteam = () => {
    particles.push({
      kind: 'steam', x: rand(GRILL.x0, GRILL.x1), y: GRILL.y + rand(-20, 10), vx: rand(-4, 4), vy: rand(-30, -18),
      size: rand(16, 28), life: 0, max: rand(2, 3.4), phase: rand(0, Math.PI * 2),
    });
  };

  const RATES = { flame: 110, ember: 16, smoke: 2.2, steam: 9 };
  const SPAWN = { flame: spawnFlame, ember: spawnEmber, smoke: spawnSmoke, steam: spawnSteam };
  const debt = { flame: 0, ember: 0, smoke: 0, steam: 0 };

  const flameColour = (t) => {
    // לבן-צהוב בבסיס, כתום באמצע, אדום כהה בקצה
    if (t < 0.3) return [255, 240 - t * 150, 170 - t * 380];
    if (t < 0.7) return [255, 195 - (t - 0.3) * 200, 60 - (t - 0.3) * 100];
    return [230 - (t - 0.7) * 300, 115 - (t - 0.7) * 200, 20];
  };

  const draw = (p) => {
    const t = p.life / p.max;
    if (p.kind === 'flame') {
      const [r, g, b] = flameColour(t);
      const size = p.size * (1 - t * 0.7);
      const a = 0.5 * (1 - t) * Math.min(1, t * 6);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
      grad.addColorStop(0, `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`);
      grad.addColorStop(1, `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, size * 0.7, size * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'ember') {
      const a = (1 - t) * (0.6 + 0.4 * Math.sin(p.phase + p.life * 14));
      ctx.fillStyle = `rgba(255, ${170 + 60 * (1 - t) | 0}, 90, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const smoke = p.kind === 'smoke';
      const size = p.size * (1 + t * (smoke ? 2.4 : 1.6));
      const a = (smoke ? 0.12 : 0.16) * Math.sin(Math.PI * t);
      const tone = smoke ? '200, 195, 190' : '255, 245, 235';
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
      grad.addColorStop(0, `rgba(${tone}, ${a})`);
      grad.addColorStop(1, `rgba(${tone}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  let last = 0;
  let frame = 0;
  let visible = true;

  const motionAllowed = () => !REDUCED.matches && !root.classList.contains('a11y-motion');

  const tick = (now) => {
    frame = 0;
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;

    Object.keys(RATES).forEach((kind) => {
      debt[kind] += RATES[kind] * dt;
      while (debt[kind] >= 1) {
        SPAWN[kind]();
        debt[kind] -= 1;
      }
    });

    ctx.clearRect(0, 0, IMG_W, IMG_H);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) {
        particles.splice(i, 1);
        continue;
      }
      if (p.kind !== 'flame') p.vx += Math.sin(p.phase + p.life * 2) * 8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    ctx.globalCompositeOperation = 'source-over';
    particles.forEach((p) => (p.kind === 'smoke' || p.kind === 'steam') && draw(p));
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach((p) => (p.kind === 'flame' || p.kind === 'ember') && draw(p));

    schedule();
  };

  const schedule = () => {
    if (!frame && visible && motionAllowed()) frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };

  const sync = () => {
    if (visible && motionAllowed()) {
      schedule();
    } else {
      stop();
      if (!motionAllowed()) {
        particles.length = 0;
        ctx.clearRect(0, 0, IMG_W, IMG_H);
      }
    }
  };

  // עוצרים כשהסצנה מחוץ למסך, כשיש העדפה לפחות תנועה, או כשמפעילים "עצירת אנימציות" בתפריט הנגישות
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(hero);
  REDUCED.addEventListener?.('change', sync);
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });

  sync();
})();
