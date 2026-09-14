document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.c-product').forEach((product) => {
    const panels = product.querySelectorAll('[data-product-panel]');
    const tabs = product.querySelectorAll('[data-product-tab]');
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      const key = tab.dataset.productTab;
      tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.productPanel === key));
      product.classList.toggle('is-use-active', key === 'use');
      if (key === 'downloads') {
        product.querySelector('.c-product__tabs-content')?.setAttribute('data-factory-section', 'product-files');
        product.querySelector('[data-product-panel="downloads"]')?.removeAttribute('data-factory-section');
      }
      if (key === 'reviews') {
        product.querySelector('.c-product__tabs-content')?.setAttribute('data-factory-section', 'product-reviews');
        product.querySelector('[data-product-panel="reviews"]')?.removeAttribute('data-factory-section');
      }
      history.replaceState(null, '', `#${key}`);
    }));
    const expand = product.querySelector('[data-product-expand]');
    const expanded = product.querySelector('[data-product-expanded]');
    if (expand && expanded) expand.addEventListener('click', () => { expanded.classList.toggle('is-open'); expand.hidden = expanded.classList.contains('is-open'); });
    const dialog = product.querySelector('[data-product-inquiry]');
    product.querySelector('[data-product-inquiry-open]')?.addEventListener('click', () => { dialog?.classList.add('is-open'); dialog?.setAttribute('aria-hidden', 'false'); product.classList.add('is-inquiry-open'); product.querySelector('.c-product__summary')?.setAttribute('data-factory-section', 'product-inquiry-overview'); });
    product.querySelector('[data-product-inquiry-close]')?.addEventListener('click', () => { dialog?.classList.remove('is-open'); dialog?.setAttribute('aria-hidden', 'true'); product.classList.remove('is-inquiry-open'); product.querySelector('.c-product__summary')?.removeAttribute('data-factory-section'); });
    const hash = window.location.hash.slice(1); const target = product.querySelector(`[data-product-tab="${hash}"]`); if (target) target.click();
  });
});
