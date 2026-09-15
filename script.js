document.addEventListener('DOMContentLoaded', () => {
  const cookieBanner = document.querySelector('.cookie-banner');
  const cookieButton = document.querySelector('.cookie-banner button');

  if (cookieButton && cookieBanner) {
    const dismissed = localStorage.getItem('wander-kits-cookie-banner');
    if (dismissed === 'true') cookieBanner.style.display = 'none';

    cookieButton.addEventListener('click', () => {
      localStorage.setItem('wander-kits-cookie-banner', 'true');
      cookieBanner.style.display = 'none';
    });
  }
});
