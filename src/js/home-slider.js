const initHomeSliders = () => {
    if (!window.Swiper) return;

    document.querySelectorAll('[data-home-slider]').forEach((slider) => {
        const swiperElement = slider.querySelector('.c-home-slider__swiper');
        const controls = slider.querySelectorAll('[data-home-slider-slide]');
        const slides = slider.querySelectorAll('.swiper-slide');
        if (!swiperElement || slides.length < 2) return;

        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const transitionTiles = slider.querySelectorAll('.c-home-slider__transition-snapshot');
        let transitionTimeout;

        const setTransitionSnapshot = (slide) => {
            if (!slide || !transitionTiles.length) return;

            const snapshot = slide.cloneNode(true);
            snapshot.classList.add('c-home-slider__slide--snapshot');
            snapshot.classList.remove('swiper-slide-active', 'swiper-slide-next', 'swiper-slide-prev');
            snapshot.setAttribute('aria-hidden', 'true');
            snapshot.querySelectorAll('a, button, input, select, textarea').forEach((element) => {
                element.tabIndex = -1;
            });

            transitionTiles.forEach((tile) => {
                tile.replaceChildren(snapshot.cloneNode(true));
            });
        };

        const revealActiveSlide = (swiper) => {
            if (reducedMotion) return;

            const activeSlide = swiper.slides[swiper.activeIndex];
            if (!activeSlide) return;

            window.clearTimeout(transitionTimeout);
            setTransitionSnapshot(activeSlide);
            slider.classList.remove('is-slide-transitioning');
            void slider.offsetWidth;
            slider.classList.add('is-slide-transitioning');
            transitionTimeout = window.setTimeout(() => {
                slider.classList.remove('is-slide-transitioning');
            }, 950);
        };

        const updatePaginationState = (swiper) => {
            const activeIndex = swiper.realIndex ?? swiper.activeIndex;

            slider.setAttribute('data-active-slide', String(activeIndex));
            slider.querySelectorAll('.c-home-slider__pagination-button').forEach((button, index) => {
                const isActive = index === activeIndex;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                button.tabIndex = isActive ? 0 : -1;
            });
        };

        const swiper = new window.Swiper(swiperElement, {
            slidesPerView: 1,
            speed: reducedMotion ? 0 : 1,
            allowTouchMove: true,
            modules: window.SwiperAutoplay ? [window.SwiperAutoplay] : [],
            autoplay: reducedMotion ? false : {
                delay: 6000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            on: {
                init: updatePaginationState,
                slideChange: (instance) => {
                    updatePaginationState(instance);
                    revealActiveSlide(instance);
                },
            },
        });

        updatePaginationState(swiper);
        window.requestAnimationFrame(() => {
            slider.classList.add('is-initial-entrance');
            window.setTimeout(() => slider.classList.remove('is-initial-entrance'), 520);
        });

        controls.forEach((control) => {
            control.addEventListener('click', () => {
                const targetIndex = Number(control.dataset.homeSliderSlide || 0);
                if (targetIndex === swiper.realIndex) return;

                swiper.slideTo(targetIndex);
            });
        });
    });
};

const initPopularProducts = () => {
    document.querySelectorAll('[data-factory-section="home-popular-products"]').forEach((section) => {
        const controls = section.querySelectorAll('[data-home-popular-category]');
        const panels = section.querySelectorAll('[data-home-popular-products-panel]');
        const categoryList = section.querySelector('.c-home-popular-products__categories');
        if (!controls.length) return;

        const updateCategoryScrollbar = () => {
            if (!categoryList) return;

            categoryList.classList.toggle('is-scrollable', categoryList.scrollHeight > categoryList.clientHeight + 1);
        };

        const activate = (control, focus = false) => {
            const activeIndex = control.getAttribute('data-home-popular-category');
            controls.forEach((item) => {
                const isActive = item === control;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-selected', isActive ? 'true' : 'false');
                item.tabIndex = isActive ? 0 : -1;
            });
            panels.forEach((panel) => {
                const isActive = panel.getAttribute('data-home-popular-products-panel') === activeIndex;
                panel.hidden = !isActive;
            });
            section.setAttribute('data-active-category', activeIndex || '0');
            if (focus) control.focus();
        };

        controls.forEach((control, index) => {
            control.addEventListener('click', () => activate(control));
            control.addEventListener('keydown', (event) => {
                if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

                event.preventDefault();
                let nextIndex = index;
                if (event.key === 'ArrowDown') nextIndex = (index + 1) % controls.length;
                if (event.key === 'ArrowUp') nextIndex = (index - 1 + controls.length) % controls.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = controls.length - 1;
                activate(controls[nextIndex], true);
            });
        });

        window.requestAnimationFrame(updateCategoryScrollbar);
        window.addEventListener('resize', updateCategoryScrollbar);
        if (typeof window.ResizeObserver === 'function' && categoryList) {
            new window.ResizeObserver(updateCategoryScrollbar).observe(categoryList);
        }
    });
};

const init = () => {
    initHomeSliders();
    initPopularProducts();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
