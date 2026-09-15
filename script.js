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
});
