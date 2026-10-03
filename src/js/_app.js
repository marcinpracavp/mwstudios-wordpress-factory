// Import głównego pliku stylów
import '../css/style.scss';

// Import AOS
import AOS from 'aos';
import 'aos/dist/aos.css';

class App {
    /**
     * Animations On Scroll (AOS)
     */
    initAos() {
        AOS.init({
            duration: 800, // Czas trwania animacji w ms
            easing: 'ease-out-cubic', // Typ easingu
            once: true, // Animacja tylko raz
            offset: 100, // Offset od góry w px
            delay: 0, // Opóźnienie w ms
            anchorPlacement: 'top-bottom', // Punkt zakotwiczenia
            disable: function() {
                return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }
        });
    }
    
    /**
     * Init headroom.js
     */
    initHeadroom() {
        const headerElement = document.querySelector('.js-headroom');
        if (headerElement && typeof window.Headroom === 'function') {
            var headroom = new Headroom(headerElement);
            headroom.init();
        } else {
            if (!headerElement) {
                console.warn('Element .js-headroom nie został znaleziony');
            }
            if (typeof window.Headroom === 'undefined') {
                console.warn('Headroom library nie jest dostępna');
            }
        }
    }

    /**
     * Keeps the shared desktop and mobile header visible while scrolling.
     */
    initStickyHeader() {
        const headerElement = document.querySelector('.l-header');
        if (!headerElement) return;

        let isTicking = false;
        const updateHeaderState = () => {
            headerElement.classList.toggle('is-sticky', window.scrollY > 4);
            isTicking = false;
        };

        const onScroll = () => {
            if (isTicking) return;
            isTicking = true;
            window.requestAnimationFrame(updateHeaderState);
        };

        updateHeaderState();
        window.addEventListener('scroll', onScroll, { passive: true });
    }
    
    /**
     * Init viewer.js
     */
    initViewer() {
        const lightBoxes = document.querySelectorAll('.viewer-js');
        if (lightBoxes.length > 0 && typeof window.Viewer === 'function') {
            lightBoxes.forEach(lightBox => {
                const images = Array.from(lightBox.querySelectorAll('[data-product-gallery-image]'));
                const viewer = new Viewer(lightBox, {
                    title: false,
                    className: 'c-product-lightbox',
                    navbar: images.length > 1,
                    toolbar: {
                        zoomIn: 1,
                        zoomOut: 1,
                        oneToOne: 1,
                        reset: 1,
                        prev: images.length > 1 ? 1 : 0,
                        next: images.length > 1 ? 1 : 0,
                    },
                });

                lightBox.addEventListener('keydown', (event) => {
                    if (!['Enter', ' '].includes(event.key)) return;

                    const image = event.target.closest('[data-product-gallery-image]');
                    if (!image || !lightBox.contains(image)) return;

                    const imageIndex = images.indexOf(image);
                    if (imageIndex < 0) return;

                    event.preventDefault();
                    viewer.view(imageIndex);
                });
            });
        } else {
            if (lightBoxes.length === 0) {
                console.log('Brak elementów .viewer-js na stronie');
            }
            if (typeof window.Viewer === 'undefined') {
                console.warn('Viewer library nie jest dostępna');
            }
        }
    }
    
    /**
     * Class toggler
     */
    activeClassToggler() {
        const togglers = document.querySelectorAll('.-js-toggler');
        if (togglers) {
            togglers.forEach(toggler => {
                toggler.addEventListener('click', () => {
                    toggler.classList.toggle('active');
                });
            });
        }
    }

    initPrimaryMenu() {
        const toggle = document.querySelector('[data-primary-menu-toggle]');
        const menu = document.querySelector('#primary-mega-menu');
        if (!toggle || !menu) return;
        const close = () => {
            menu.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('primary-menu-open');
        };
        const open = () => {
            menu.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('primary-menu-open');
        };
        toggle.addEventListener('click', () => menu.hidden ? open() : close());
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
        document.addEventListener('click', (event) => {
            if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) close();
        });
        menu.querySelectorAll('[data-mega-category]').forEach((item) => item.addEventListener('click', () => {
            menu.querySelectorAll('[data-mega-category]').forEach((button) => { button.setAttribute('aria-selected', 'false'); button.tabIndex = -1; });
            item.setAttribute('aria-selected', 'true'); item.tabIndex = 0;
        }));
        menu.querySelectorAll('[data-mega-crop]').forEach((item) => item.addEventListener('click', () => {
            menu.querySelectorAll('[data-mega-crop]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
            item.setAttribute('aria-pressed', 'true');
        }));
    }

    initProductInquiry() {
        const inquiryLinks = document.querySelectorAll('[data-product-inquiry-subject]');
        const subjectField = document.querySelector('[data-footer-inquiry-subject]');
        const messageField = document.querySelector('#footer-contact-form [name="footer_question"]');

        if (!inquiryLinks.length) return;

        inquiryLinks.forEach((link) => {
            link.addEventListener('click', () => {
                const inquirySubject = link.dataset.productInquirySubject || '';

                if (subjectField) {
                    subjectField.value = inquirySubject;
                }

                if (messageField) {
                    messageField.value = inquirySubject;
                }
            });
        });
    }
    
    /**
     * Execute on page ready
     */
    pageReady() {
        document.body.classList.add('loaded');
        document.body.classList.remove("preload");
    }
    
    reinit() {
        this.initAos();
    }
    
    init() {
        this.initAos();
        this.initHeadroom();
        this.initStickyHeader();
        this.initViewer();
        this.activeClassToggler();
        this.initPrimaryMenu();
        this.initProductInquiry();
        this.pageReady();
    }
}

// Inicjalizuj od razu gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', function() {
    const app = new App();
    app.init();
});

// Automatyczny import wszystkich plików JS (oprócz _app.js)
function requireAll(r) {
    r.keys().forEach(r);
}

// Import wszystkich plików JS z aktualnego folderu (oprócz lib/ i _app.js)
requireAll(require.context('./', false, /^(?!.*\/_app\.js$).*\.js$/));
