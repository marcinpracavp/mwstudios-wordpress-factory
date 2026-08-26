import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Swiper } from 'swiper';

class AuraSite {
    constructor() {
        this.lenis = null;
        this.menuToggle = document.querySelector('[data-aura-menu-toggle]');
        this.mobileMenu = document.querySelector('[data-aura-mobile-menu]');
        this.search = document.querySelector('[data-aura-search]');
    }

    initLenis() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        this.lenis = new Lenis({
            autoRaf: true,
            anchors: true,
            duration: 1.05,
            smoothWheel: true,
            allowNestedScroll: true,
        });
        window.auraLenis = this.lenis;
    }

    setPageLocked(locked) {
        document.body.classList.toggle('aura-overlay-open', locked);
        if (this.lenis) {
            locked ? this.lenis.stop() : this.lenis.start();
        }
    }

    initMenu() {
        if (!this.menuToggle || !this.mobileMenu) {
            return;
        }

        this.menuToggle.addEventListener('click', () => {
            const willOpen = this.mobileMenu.hidden;
            this.mobileMenu.hidden = !willOpen;
            this.menuToggle.setAttribute('aria-expanded', String(willOpen));
            this.setPageLocked(willOpen);
        });

        this.mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                this.mobileMenu.hidden = true;
                this.menuToggle.setAttribute('aria-expanded', 'false');
                this.setPageLocked(false);
            });
        });
    }

    initSearch() {
        if (!this.search) {
            return;
        }

        const input = this.search.querySelector('input[type="search"]');
        const openButtons = document.querySelectorAll('[data-aura-search-open]');
        const closeButtons = this.search.querySelectorAll('[data-aura-search-close]');
        const close = () => {
            this.search.hidden = true;
            this.setPageLocked(false);
        };

        openButtons.forEach((button) => button.addEventListener('click', () => {
            this.search.hidden = false;
            this.setPageLocked(true);
            window.requestAnimationFrame(() => input?.focus());
        }));
        closeButtons.forEach((button) => button.addEventListener('click', close));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.search.hidden) {
                close();
            }
        });
    }

    initSliders() {
		if (window.matchMedia('(max-width: 767px)').matches) {
			return;
		}

        document.querySelectorAll('[data-aura-products-slider]').forEach((element) => {
            if (element.querySelectorAll('.swiper-slide').length < 2) {
                return;
            }
            new Swiper(element, {
                slidesPerView: 1.16,
                spaceBetween: 14,
                watchOverflow: true,
                breakpoints: {
                    768: { slidesPerView: 4, spaceBetween: 24 },
                },
            });
        });

        document.querySelectorAll('[data-aura-reviews-slider]').forEach((element) => {
            if (element.querySelectorAll('.swiper-slide').length < 2) {
                return;
            }
            new Swiper(element, {
                slidesPerView: 1.14,
                spaceBetween: 14,
                watchOverflow: true,
                breakpoints: {
                    768: { slidesPerView: 3, spaceBetween: 24 },
                },
            });
        });
    }

    initProductActions() {
        const stickyButton = document.querySelector('[data-aura-sticky-submit]');
        const addButton = document.querySelector('.aura-product__buy .single_add_to_cart_button');
        stickyButton?.addEventListener('click', () => addButton?.click());

        const filtersButton = document.querySelector('[data-aura-filters-open]');
        const filters = document.querySelector('[data-aura-filters]');
        filtersButton?.addEventListener('click', () => filters?.classList.toggle('is-open'));
    }

    init() {
        if (!document.body.classList.contains('aura-site')) {
            return;
        }
        this.initLenis();
        this.initMenu();
        this.initSearch();
        this.initSliders();
        this.initProductActions();
    }
}

document.addEventListener('DOMContentLoaded', () => new AuraSite().init());
