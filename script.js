document.addEventListener('DOMContentLoaded', () => {
  const cookieBanner = document.querySelector('.cookie-banner');
  const cookieButton = document.querySelector('.cookie-banner button');
  const saveLinkBtn = document.querySelector('[data-save-link]');

  if (cookieButton && cookieBanner) {
    const dismissed = localStorage.getItem('wander-kits-cookie-banner');
    if (dismissed === 'true') cookieBanner.style.display = 'none';

    cookieButton.addEventListener('click', () => {
      localStorage.setItem('wander-kits-cookie-banner', 'true');
      cookieBanner.style.display = 'none';
    });
  }

  if (saveLinkBtn) {
    const savedKey = 'aruaim-saved-link';
    const statusText = saveLinkBtn.querySelector('.save-link-text');

    const setSavedState = () => {
      const uniqueCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const currentUrl = window.location.href;
      const shortUrl = `${currentUrl}#save-${uniqueCode}`;
      localStorage.setItem(savedKey, shortUrl);

      if (statusText) {
        statusText.textContent = 'הקישור נשמר 🍷';
      }

      saveLinkBtn.setAttribute('aria-label', 'הקישור נשמר עם סמל כוס יין');
      saveLinkBtn.dataset.saved = 'true';
      saveLinkBtn.title = 'הקישור נשמר';
      saveLinkBtn.setAttribute('data-link', shortUrl);
    };

    const savedValue = localStorage.getItem(savedKey);
    if (savedValue) {
      saveLinkBtn.setAttribute('data-link', savedValue);
      if (statusText) statusText.textContent = 'הקישור נשמר 🍷';
      saveLinkBtn.dataset.saved = 'true';
      saveLinkBtn.setAttribute('aria-label', 'הקישור נשמר עם סמל כוס יין');
    }

    saveLinkBtn.addEventListener('click', () => {
      if (saveLinkBtn.dataset.saved === 'true') {
        const link = saveLinkBtn.getAttribute('data-link') || window.location.href;
        navigator.clipboard?.writeText(link).catch(() => {});
        if (statusText) statusText.textContent = 'הקישור הועתק 🍷';
        return;
      }

      setSavedState();
      const link = saveLinkBtn.getAttribute('data-link') || window.location.href;
      navigator.clipboard?.writeText(link).catch(() => {});
    });
  }

  const signupForm = document.querySelector('[data-signup-form]');

  if (signupForm) {
    const nameInput = signupForm.elements.name;
    const phoneInput = signupForm.elements.phone;
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const status = signupForm.querySelector('.form-status');

    const normalizePhone = (value) => {
      let digits = value.replace(/\D/g, '');
      if (digits.startsWith('972')) digits = `0${digits.slice(3)}`;
      return /^0(5\d|7\d|[2-489])\d{7}$/.test(digits) ? digits : '';
    };

    const setStatus = (message, type) => {
      status.textContent = message;
      status.dataset.type = type;
    };

    const markInvalid = (input, invalid) => {
      input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    };

    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = nameInput.value.trim();
      const phone = normalizePhone(phoneInput.value);

      markInvalid(nameInput, name.length < 2);
      markInvalid(phoneInput, !phone);

      if (name.length < 2) {
        setStatus('נא להזין שם מלא.', 'error');
        nameInput.focus();
        return;
      }

      if (!phone) {
        setStatus('נא להזין מספר טלפון ישראלי תקין.', 'error');
        phoneInput.focus();
        return;
      }

      const endpoint = signupForm.dataset.endpoint;
      if (!endpoint) {
        setStatus('הטופס עדיין לא מחובר לגוגל שיטס.', 'error');
        return;
      }

      submitBtn.disabled = true;
      setStatus('שולח...', 'pending');

      try {
        // no-cors: Apps Script מבצע הפניה, ולכן לא קוראים את התשובה
        await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          body: new URLSearchParams({
            name,
            phone,
            website: signupForm.elements.website.value,
            source: 'אתר',
          }),
        });

        signupForm.reset();
        setStatus('תודה! הפרטים נשמרו ונחזור אליכם בקרוב 🍷', 'success');
      } catch {
        setStatus('השליחה נכשלה. נסו שוב או שלחו לנו וואטסאפ.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});
