// אש חיה על כל תמונה שיש בה מדורה: להבות שמרצדות, גחלים שעפות, עשן ואדים מהאוכל.
// לכל תמונה יש הגדרות בפיקסלים של הקובץ המקורי, והמנוע ממפה אותן לגודל שבו התמונה מוצגת.
(() => {
  const MOBILE = window.matchMedia('(max-width: 980px)');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  if (!document.createElement('canvas').getContext) return;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const motionAllowed = () => !REDUCED.matches && !root.classList.contains('a11y-motion');

  // unit מתאים את גודל החלקיקים לרזולוציה של הקובץ: 1 לתמונה הראשית, פחות לתמונות הקטנות
  const SCENES = {
    hero: {
      w: 1370, h: 1148, unit: 1,
      flames: [
        { x0: 545, x1: 715, y: 725, h: 190, scale: 1, share: 0.6 },
        { x0: 470, x1: 710, y: 910, h: 80, scale: 0.8, share: 0.4 },
      ],
      embers: { x0: 560, x1: 700, y0: 680, y1: 740 },
      smoke: [{ x0: 540, x1: 680, y0: 600, y1: 650 }],
      steam: [{ x0: 400, x1: 830, y0: 740, y1: 770 }],
      rates: { flame: 110, ember: 16, smoke: 2.2, steam: 9 },
    },
    longTable: {
      w: 768, h: 1376, unit: 0.75,
      flames: [{ x0: 648, x1: 752, y: 722, h: 170, scale: 1, share: 1 }],
      embers: { x0: 650, x1: 740, y0: 640, y1: 700 },
      smoke: [{ x0: 625, x1: 720, y0: 560, y1: 600 }],
      steam: [
        { x0: 435, x1: 515, y0: 715, y1: 735 },
        { x0: 230, x1: 470, y0: 1170, y1: 1200 },
      ],
      rates: { flame: 60, ember: 14, smoke: 1.5, steam: 5 },
    },
    forest: {
      w: 685, h: 381, unit: 0.45,
      flames: [{ x0: 300, x1: 366, y: 335, h: 85, scale: 1, share: 1 }],
      embers: { x0: 305, x1: 360, y0: 300, y1: 330 },
      smoke: [{ x0: 300, x1: 360, y0: 255, y1: 280 }],
      steam: [{ x0: 290, x1: 345, y0: 148, y1: 158 }],
      rates: { flame: 45, ember: 8, smoke: 1, steam: 3 },
    },
    beach: {
      w: 685, h: 381, unit: 0.5,
      flames: [{ x0: 310, x1: 390, y: 300, h: 110, scale: 1, share: 1 }],
      embers: { x0: 315, x1: 385, y0: 260, y1: 300 },
      smoke: [{ x0: 315, x1: 380, y0: 185, y1: 210 }],
      steam: [],
      rates: { flame: 50, ember: 9, smoke: 0.8, steam: 0 },
    },
    backyard: {
      w: 685, h: 381, unit: 0.5,
      flames: [{ x0: 140, x1: 240, y: 270, h: 22, scale: 0.45, share: 1 }],
      embers: { x0: 145, x1: 235, y0: 255, y1: 268 },
      smoke: [{ x0: 150, x1: 230, y0: 235, y1: 260 }],
      steam: [{ x0: 320, x1: 420, y0: 265, y1: 280 }],
      rates: { flame: 22, ember: 3, smoke: 3, steam: 2 },
    },
    cheers: {
      w: 685, h: 381, unit: 0.4,
      flames: [{ x0: 315, x1: 365, y: 88, h: 70, scale: 1, share: 1 }],
      embers: { x0: 318, x1: 362, y0: 60, y1: 85 },
      smoke: [
        { x0: 320, x1: 360, y0: 20, y1: 40 },
        { x0: 520, x1: 580, y0: 30, y1: 45 },
      ],
      steam: [],
      rates: { flame: 30, ember: 5, smoke: 1.6, steam: 0 },
    },
  };

  const flameColour = (t) => {
    // לבן-צהוב בבסיס, כתום באמצע, אדום כהה בקצה
    if (t < 0.3) return [255, 240 - t * 150, 170 - t * 380];
    if (t < 0.7) return [255, 195 - (t - 0.3) * 200, 60 - (t - 0.3) * 100];
    return [230 - (t - 0.7) * 300, 115 - (t - 0.7) * 200, 20];
  };

  // fit מחזיר איך התמונה מוצגת: 'cover' (ממלאת וחותכת) או 'top' (רוחב מלא בראש האזור).
  // fixed: הקנבס כבר בקואורדינטות התמונה (הסצנה הראשית מוזזת כולה ב-CSS).
  const createFire = ({ canvas, box, cfg, fit = () => 'cover', fixed = false }) => {
    const ctx = canvas.getContext('2d');
    const particles = [];
    const debt = { flame: 0, ember: 0, smoke: 0, steam: 0 };
    const u = cfg.unit;
    let frame = 0;
    let last = 0;
    let visible = false;

    const resize = () => {
      if (fixed) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const s = fit() === 'top' ? w / cfg.w : Math.max(w / cfg.w, h / cfg.h);
      const x = (w - cfg.w * s) / 2;
      const y = fit() === 'top' ? 0 : (h - cfg.h * s) / 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(s * dpr, 0, 0, s * dpr, x * dpr, y * dpr);
    };

    const spawn = {
      flame() {
        let src = cfg.flames[0];
        let roll = Math.random();
        for (const f of cfg.flames) {
          src = f;
          if ((roll -= f.share) <= 0) break;
        }
        const x = rand(src.x0, src.x1);
        const centre = (src.x0 + src.x1) / 2;
        particles.push({
          kind: 'flame', x, y: src.y + rand(-8, 8) * u, vx: (centre - x) * 0.25 + rand(-12, 12) * u, vy: -src.h * rand(1.2, 1.9),
          size: rand(28, 52) * u * src.scale, life: 0, max: rand(0.45, 0.85),
        });
      },
      ember() {
        const e = cfg.embers;
        particles.push({
          kind: 'ember', x: rand(e.x0, e.x1), y: rand(e.y0, e.y1), vx: rand(-35, 35) * u, vy: rand(-170, -90) * u,
          size: rand(2.2, 4.8) * u, life: 0, max: rand(2.2, 4), phase: rand(0, Math.PI * 2),
        });
      },
      smoke() {
        const s = pick(cfg.smoke);
        particles.push({
          kind: 'smoke', x: rand(s.x0, s.x1), y: rand(s.y0, s.y1), vx: rand(-6, 10) * u, vy: rand(-38, -24) * u,
          size: rand(30, 50) * u, life: 0, max: rand(5, 8), phase: rand(0, Math.PI * 2),
        });
      },
      steam() {
        const s = pick(cfg.steam);
        particles.push({
          kind: 'steam', x: rand(s.x0, s.x1), y: rand(s.y0, s.y1), vx: rand(-4, 4) * u, vy: rand(-30, -18) * u,
          size: rand(16, 28) * u, life: 0, max: rand(2, 3.4), phase: rand(0, Math.PI * 2),
        });
      },
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

    const clear = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const tick = (now) => {
      frame = 0;
      const dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;

      Object.keys(debt).forEach((kind) => {
        debt[kind] += (cfg.rates[kind] || 0) * dt;
        while (debt[kind] >= 1) {
          spawn[kind]();
          debt[kind] -= 1;
        }
      });

      clear();
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        if (p.kind !== 'flame') p.vx += Math.sin(p.phase + p.life * 2) * 8 * u * dt;
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

    const sync = () => {
      if (visible && motionAllowed()) {
        schedule();
        return;
      }
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!motionAllowed()) {
        particles.length = 0;
        clear();
      }
    };

    resize();
    if (!fixed) new ResizeObserver(resize).observe(box);
    MOBILE.addEventListener?.('change', resize);
    // עוצרים כשהתמונה מחוץ למסך, כשיש העדפה לפחות תנועה, או כשמפעילים "עצירת אנימציות" בתפריט הנגישות
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(box);
    REDUCED.addEventListener?.('change', sync);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  };

  // הסצנה הראשית: ממוקמת כמו background-size: cover במחשב, וכמו רוחב מלא בראש האזור בטלפון
  const hero = document.querySelector('.hero');
  const heroScene = hero?.querySelector('.hero-scene');
  const heroCanvas = heroScene?.querySelector('.scene-fire');
  if (hero && heroScene && heroCanvas) {
    const { w: IMG_W, h: IMG_H } = SCENES.hero;
    const layout = () => {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      const scale = MOBILE.matches ? w / IMG_W : Math.max(w / IMG_W, h / IMG_H);
      const x = (w - IMG_W * scale) / 2;
      const y = MOBILE.matches ? 0 : (h - IMG_H * scale) / 2;
      heroScene.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };
    heroScene.classList.add('is-live');
    layout();
    MOBILE.addEventListener?.('change', layout);
    new ResizeObserver(layout).observe(hero);
    createFire({ canvas: heroCanvas, box: hero, cfg: SCENES.hero, fixed: true });
  }

  // שאר התמונות: כרטיסי החוויה (תמונת רקע) והגלריה (תמונה עם object-fit: cover)
  const cardFit = () => (MOBILE.matches ? 'top' : 'cover');
  const PHOTOS = [
    { box: document.querySelector('.image-card.one'), cfg: SCENES.forest, fit: cardFit },
    { box: document.querySelector('.image-card.two'), cfg: SCENES.beach, fit: cardFit },
    { box: document.querySelector('img[src$="long-table.jpg"]')?.closest('figure'), cfg: SCENES.longTable },
    { box: document.querySelector('img[src$="cheers.jpg"]')?.closest('figure'), cfg: SCENES.cheers },
    { box: document.querySelector('img[src$="backyard-grill.jpg"]')?.closest('figure'), cfg: SCENES.backyard },
  ];

  PHOTOS.forEach(({ box, cfg, fit }) => {
    if (!box) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fire-layer';
    canvas.setAttribute('aria-hidden', 'true');
    box.prepend(canvas);
    createFire({ canvas, box, cfg, fit });
  });
})();
