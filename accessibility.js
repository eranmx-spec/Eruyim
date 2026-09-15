// תפריט נגישות: ההעדפות מוחלות מיד (הסקריפט נטען ב-head כדי שהדף לא יהבהב),
// והכפתור עצמו נבנה אחרי שהדף נטען.
(() => {
  const STORAGE_KEY = 'eruyim-a11y';
  const FONT_STEPS = [100, 110, 120, 130, 140];
  const TOGGLES = [
    { key: 'contrast', label: 'ניגודיות גבוהה' },
    { key: 'grayscale', label: 'גווני אפור' },
    { key: 'links', label: 'הדגשת קישורים' },
    { key: 'readable', label: 'גופן קריא' },
    { key: 'spacing', label: 'ריווח טקסט' },
    { key: 'cursor', label: 'סמן גדול' },
    { key: 'motion', label: 'עצירת אנימציות' },
  ];
  const root = document.documentElement;

  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const state = loadState();

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // אחסון חסום (למשל גלישה פרטית) – ההגדרות יחולו רק בעמוד הנוכחי
    }
  };

  const fontLevel = () => Math.min(Math.max(Math.trunc(Number(state.font)) || 0, 0), FONT_STEPS.length - 1);

  const applyState = () => {
    root.style.fontSize = fontLevel() ? `${FONT_STEPS[fontLevel()]}%` : '';
    TOGGLES.forEach(({ key }) => root.classList.toggle(`a11y-${key}`, Boolean(state[key])));
  };

  applyState();

  const icon = `
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false">
      <circle cx="12" cy="4" r="2.1" fill="currentColor" />
      <path fill="currentColor" d="M4 7.5c2.6.8 5.3 1.2 8 1.2s5.4-.4 8-1.2l.5 1.9c-2 .6-4.1 1-6.3 1.2v3.2l2.3 7.6-1.9.6L12.4 15h-.8l-2.2 7-1.9-.6 2.3-7.6v-3.2c-2.2-.2-4.3-.6-6.3-1.2z" />
    </svg>`;

  const buildWidget = () => {
    const widget = document.createElement('div');
    widget.className = 'a11y-widget';
    widget.innerHTML = `
      <button type="button" class="a11y-toggle" aria-expanded="false" aria-controls="a11y-panel" aria-label="תפריט נגישות">${icon}</button>
      <div class="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-title" hidden>
        <div class="a11y-head">
          <h2 id="a11y-title">תפריט נגישות</h2>
          <button type="button" class="a11y-close" aria-label="סגירת תפריט הנגישות">×</button>
        </div>
        <div class="a11y-font" role="group" aria-label="גודל טקסט">
          <button type="button" class="a11y-btn" data-font-step="-1">הקטנת טקסט</button>
          <output class="a11y-font-value" aria-live="polite"></output>
          <button type="button" class="a11y-btn" data-font-step="1">הגדלת טקסט</button>
        </div>
        <div class="a11y-grid">
          ${TOGGLES.map(({ key, label }) => `<button type="button" class="a11y-btn" data-toggle="${key}" aria-pressed="false">${label}</button>`).join('')}
        </div>
        <div class="a11y-footer">
          <button type="button" class="a11y-btn a11y-reset">איפוס הגדרות</button>
          <a href="accessibility.html">הצהרת נגישות</a>
        </div>
      </div>`;
    document.body.appendChild(widget);

    const toggleBtn = widget.querySelector('.a11y-toggle');
    const panel = widget.querySelector('.a11y-panel');
    const fontValue = widget.querySelector('.a11y-font-value');
    const [fontDown, fontUp] = widget.querySelectorAll('[data-font-step]');

    const render = () => {
      const level = fontLevel();
      fontValue.textContent = `${FONT_STEPS[level]}%`;
      // aria-disabled ולא disabled, כדי שהפוקוס לא ייעלם מהכפתור בקצה הטווח
      fontDown.setAttribute('aria-disabled', String(level === 0));
      fontUp.setAttribute('aria-disabled', String(level === FONT_STEPS.length - 1));
      widget.querySelectorAll('[data-toggle]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(Boolean(state[btn.dataset.toggle])));
      });
    };

    const update = () => {
      applyState();
      saveState();
      render();
    };

    const setOpen = (open) => {
      panel.hidden = !open;
      toggleBtn.setAttribute('aria-expanded', String(open));
      if (open) panel.querySelector('button').focus();
    };

    toggleBtn.addEventListener('click', () => setOpen(panel.hidden));

    panel.addEventListener('click', (event) => {
      const btn = event.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('a11y-close')) {
        setOpen(false);
        toggleBtn.focus();
      } else if (btn.dataset.fontStep) {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        state.font = fontLevel() + Number(btn.dataset.fontStep);
        update();
      } else if (btn.dataset.toggle) {
        state[btn.dataset.toggle] = !state[btn.dataset.toggle];
        update();
      } else if (btn.classList.contains('a11y-reset')) {
        Object.keys(state).forEach((key) => delete state[key]);
        update();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        toggleBtn.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!panel.hidden && !widget.contains(event.target)) setOpen(false);
    });

    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
