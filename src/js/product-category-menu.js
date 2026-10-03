const initProductCategoryMenus = () => {
    document.querySelectorAll('[data-product-category-menu]').forEach((menu) => {
        const triggers = Array.from(menu.querySelectorAll('[data-product-category-trigger]'));
        const panels = Array.from(menu.querySelectorAll('[data-product-category-panel]'));
        const categoryList = menu.querySelector('.c-product-list-menu__list');
        let closeTimeout;

        if (!triggers.length || !panels.length) return;

        const cancelClose = () => window.clearTimeout(closeTimeout);
        const close = () => {
            triggers.forEach((trigger) => {
                trigger.setAttribute('aria-expanded', 'false');
                trigger.closest('.c-product-list-menu__item')?.classList.remove('is-active');
            });
            panels.forEach((panel) => {
                panel.hidden = true;
                panel.setAttribute('aria-hidden', 'true');
            });
            menu.style.removeProperty('--product-category-menu-offset');
        };

        const scheduleClose = () => {
            cancelClose();
            closeTimeout = window.setTimeout(close, 220);
        };

        const updatePanelOffset = () => {
            const activeItem = menu.querySelector('.c-product-list-menu__item.is-active');
            if (!activeItem) return;

            const menuRect = menu.getBoundingClientRect();
            const activeItemRect = activeItem.getBoundingClientRect();
            const offset = activeItemRect.top - menuRect.top + activeItemRect.height / 2;

            menu.style.setProperty('--product-category-menu-offset', `${offset}px`);
        };

        const open = (categoryId) => {
            cancelClose();
            const activeTrigger = triggers.find((trigger) => trigger.dataset.productCategoryTrigger === categoryId);
            const activeItem = activeTrigger?.closest('.c-product-list-menu__item');
            triggers.forEach((trigger) => {
                const isActive = trigger.dataset.productCategoryTrigger === categoryId;
                trigger.setAttribute('aria-expanded', String(isActive));
                trigger.closest('.c-product-list-menu__item')?.classList.toggle('is-active', isActive);
            });
            panels.forEach((panel) => {
                const isActive = panel.dataset.productCategoryPanel === categoryId;
                panel.hidden = !isActive;
                panel.setAttribute('aria-hidden', String(!isActive));
            });
            if (activeItem) updatePanelOffset();
        };

        triggers.forEach((trigger) => {
            const categoryId = trigger.dataset.productCategoryTrigger;
            if (!categoryId) return;

            trigger.addEventListener('mouseenter', () => open(categoryId));
            trigger.addEventListener('focus', () => open(categoryId));
        });

        menu.addEventListener('mouseenter', cancelClose);
        menu.addEventListener('mouseleave', scheduleClose);
        categoryList?.addEventListener('scroll', updatePanelOffset, { passive: true });
        window.addEventListener('resize', updatePanelOffset);
        menu.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!menu.contains(document.activeElement)) close();
            });
        });
        menu.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;

            close();
            event.currentTarget.querySelector('[data-product-category-trigger]')?.focus();
        });
    });
};

const initHeaderProductMenu = () => {
    const toggles = Array.from(document.querySelectorAll('[data-product-category-menu-toggle]'));

    toggles.forEach((toggle) => {
        const menu = document.getElementById(toggle.dataset.productCategoryMenuToggle);
        if (!menu) return;

        let closeTimeout;
        const cancelClose = () => window.clearTimeout(closeTimeout);
        const close = () => {
            menu.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        };
        const open = () => {
            cancelClose();
            menu.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
        };
        const scheduleClose = () => {
            cancelClose();
            closeTimeout = window.setTimeout(close, 220);
        };

        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            menu.hidden ? open() : close();
        });
        toggle.addEventListener('mouseenter', open);
        toggle.addEventListener('focus', open);
        toggle.addEventListener('mouseleave', scheduleClose);
        menu.addEventListener('mouseenter', cancelClose);
        menu.addEventListener('mouseleave', scheduleClose);
        menu.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!menu.contains(document.activeElement) && document.activeElement !== toggle) close();
            });
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !menu.hidden) {
                close();
                toggle.focus();
            }
        });
    });
};

const initProductContactCtaClearance = () => {
    const productDetail = document.querySelector('.c-product-detail');
    const menu = productDetail?.querySelector('.c-product-detail__menu');
    const contactCta = document.querySelector('[data-factory-section="product-contact-cta"]');

    if (!productDetail || !menu || !contactCta) return;

    const updateClearance = () => {
        contactCta.style.removeProperty('--product-contact-cta-sidebar-clearance');

        if (!window.matchMedia('(min-width: 1201px)').matches) return;

        const detailBottom = productDetail.getBoundingClientRect().bottom;
        const menuBottom = menu.getBoundingClientRect().bottom;

        if (menuBottom <= detailBottom) return;

        const ctaTop = contactCta.getBoundingClientRect().top;
        const missingClearance = menuBottom + 20 - ctaTop;

        if (missingClearance > 0) {
            contactCta.style.setProperty('--product-contact-cta-sidebar-clearance', `${missingClearance}px`);
        }
    };

    let animationFrame;
    const scheduleUpdate = () => {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(updateClearance);
    };

    scheduleUpdate();
    window.addEventListener('load', scheduleUpdate, { once: true });
    window.addEventListener('resize', scheduleUpdate);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initProductCategoryMenus();
        initHeaderProductMenu();
        initProductContactCtaClearance();
    }, { once: true });
} else {
    initProductCategoryMenus();
    initHeaderProductMenu();
    initProductContactCtaClearance();
}
