document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-quantity]');
    if (!button) return;
    const input = button.parentElement.querySelector('input.qty');
    if (!input) return;
    const step = Number(input.step || 1);
    const minimum = Number(input.min || 0);
    const maximum = input.max === '' ? Infinity : Number(input.max);
    const current = Number(input.value || minimum);
    input.value = Math.min(maximum, Math.max(minimum, current + (button.dataset.cartQuantity === 'increase' ? step : -step)));
    input.dispatchEvent(new Event('change', { bubbles: true }));
});
