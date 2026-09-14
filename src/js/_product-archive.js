document.addEventListener('DOMContentLoaded', () => {
    const expand = document.querySelector('.c-product-archive__description-expand');
    const copy = document.querySelector('.c-product-archive__description-copy');
    if (!expand || !copy) return;

    expand.addEventListener('click', () => {
        copy.classList.add('is-expanded');
        expand.setAttribute('aria-expanded', 'true');
        expand.hidden = true;
    });
});
