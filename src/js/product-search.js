const initProductSearch = () => {
    document.querySelectorAll('[data-product-search]').forEach((search) => {
        const form = search.querySelector('[data-product-search-form]');
        const input = search.querySelector('[data-product-search-input]');
        const results = search.querySelector('[data-product-search-results]');

        if (!form || !input || !results || !form.dataset.endpoint || !form.dataset.nonce) return;

        let debounceTimer;
        let requestController;

        const closeResults = () => {
            results.hidden = true;
            results.replaceChildren();
            input.setAttribute('aria-expanded', 'false');
        };

        const showMessage = (message, className) => {
            const messageElement = document.createElement('p');
            messageElement.className = className;
            messageElement.textContent = message;
            results.replaceChildren(messageElement);
            results.hidden = false;
            input.setAttribute('aria-expanded', 'true');
        };

        const showResults = (products) => {
            if (!products.length) {
                showMessage('Nie znaleziono produktów.', 'l-header__search-empty');
                return;
            }

            const fragment = document.createDocumentFragment();
            products.forEach((product) => {
                const link = document.createElement('a');
                const title = document.createElement('span');
                const sku = document.createElement('span');

                link.className = 'l-header__search-result';
                link.href = product.url;
                title.className = 'l-header__search-result-title';
                title.textContent = product.title;
                link.append(title);

                if (product.sku) {
                    sku.className = 'l-header__search-result-sku';
                    sku.textContent = `SKU: ${product.sku}`;
                    link.append(sku);
                }

                fragment.append(link);
            });

            results.replaceChildren(fragment);
            results.hidden = false;
            input.setAttribute('aria-expanded', 'true');
        };

        const searchProducts = async () => {
            const term = input.value.trim();
            if (term.length < 2) {
                closeResults();
                return;
            }

            requestController?.abort();
            requestController = new AbortController();
            showMessage('Szukam produktów…', 'l-header__search-loading');

            const requestBody = new URLSearchParams({
                action: 'emko_product_search',
                nonce: form.dataset.nonce,
                term,
            });

            try {
                const response = await fetch(form.dataset.endpoint, {
                    method: 'POST',
                    body: requestBody,
                    credentials: 'same-origin',
                    signal: requestController.signal,
                });
                const payload = await response.json();

                if (!response.ok || !payload.success) {
                    throw new Error('Product search failed');
                }

                showResults(payload.data?.results || []);
            } catch (error) {
                if (error.name === 'AbortError') return;

                showMessage('Wyszukiwanie jest chwilowo niedostępne.', 'l-header__search-empty');
            }
        };

        input.addEventListener('input', () => {
            window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(searchProducts, 220);
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeResults();
                input.blur();
            }
        });

        search.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!search.contains(document.activeElement)) closeResults();
            });
        });

        document.addEventListener('click', (event) => {
            if (!search.contains(event.target)) closeResults();
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductSearch, { once: true });
} else {
    initProductSearch();
}
