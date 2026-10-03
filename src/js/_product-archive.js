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

const initProductListFilters = () => {
    document.querySelectorAll('[data-factory-section="product-list-filters"]').forEach((section) => {
        const form = section.querySelector('.c-product-list-filters__form');
        const category = form?.dataset.productCategory || '';
        let listing = document.querySelector('[data-factory-section="product-list-items"]');
        let requestTimer;
        let requestController;

        const requestFilteredProducts = async () => {
            if (!form || !listing || !window.ajax?.url || !window.ajax?.productFiltersNonce) {
                return false;
            }

            requestController?.abort();
            const controller = new AbortController();
            requestController = controller;
            listing.classList.add('is-loading');
            listing.setAttribute('aria-busy', 'true');

            const formData = new URLSearchParams({
                action: 'emko_filter_products',
                nonce: window.ajax.productFiltersNonce,
                strength: form.elements.strength?.value || '0',
                extension: form.elements.extension?.value || '0',
            });
            if (category) {
                formData.set('product_cat', category);
            }

            try {
                const response = await fetch(window.ajax.url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    body: formData.toString(),
                    signal: controller.signal,
                });
                const payload = await response.json();
                if (!payload.success || !payload.data?.html) {
                    throw new Error('Product filter response is invalid.');
                }

                const template = document.createElement('template');
                template.innerHTML = payload.data.html;
                const nextListing = template.content.querySelector('[data-factory-section="product-list-items"]');
                if (!nextListing) {
                    throw new Error('Product filter markup is missing.');
                }

                listing.replaceWith(nextListing);
                listing = nextListing;

                const url = new URL(window.location.href);
                if (category) {
                    url.searchParams.set('product_cat', category);
                } else {
                    url.searchParams.delete('product_cat');
                }
                url.searchParams.set('strength', form.elements.strength?.value || '0');
                url.searchParams.set('extension', form.elements.extension?.value || '0');
                url.searchParams.delete('paged');
                url.searchParams.delete('product_page');
                window.history.replaceState({}, '', url);
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Nie udało się odświeżyć listy produktów.', error);
                }
                return false;
            } finally {
                if (listing && requestController === controller) {
                    listing.classList.remove('is-loading');
                    listing.removeAttribute('aria-busy');
                }
            }
        };

        section.querySelectorAll('.c-product-list-filters__slider').forEach((slider) => {
            const input = slider.querySelector('.c-product-list-filters__input');
            const handle = slider.querySelector('.c-product-list-filters__handle');
            const valueTrack = slider.querySelector('.c-product-list-filters__value-track');
            if (!input || !handle || !valueTrack) return;

            const update = () => {
                const min = Number(input.min) || 0;
                const max = Number(input.max) || 100;
                const value = Math.max(min, Math.min(max, Number(input.value) || min));
                const progress = (value - min) / (max - min || 1);
                const handleLeft = Math.max(0, Math.min(286, progress * 290 - 1));
                handle.style.left = `${handleLeft}px`;
                valueTrack.style.width = `${Math.max(4, handleLeft + 4)}px`;
            };

            input.addEventListener('input', () => {
                update();
                window.clearTimeout(requestTimer);
                requestTimer = window.setTimeout(requestFilteredProducts, 250);
            });
            update();
        });

        form?.addEventListener('submit', (event) => {
            if (!window.ajax?.url || !window.ajax?.productFiltersNonce) {
                return;
            }

            event.preventDefault();
            window.clearTimeout(requestTimer);
            requestFilteredProducts();
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductListFilters, { once: true });
} else {
    initProductListFilters();
}
