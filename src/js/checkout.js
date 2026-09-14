document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.querySelector('[data-factory-section="account-registration-dialog"]');
  const opener = document.querySelector('[data-checkout-registration-open]');
  if (!dialog || !opener) return;

  const close = () => {
    dialog.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    opener.focus();
  };
  opener.addEventListener('click', () => {
    dialog.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    dialog.querySelector('input')?.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) close();
  });
});
