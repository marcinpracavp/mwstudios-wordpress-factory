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
                // Wyłącz na urządzeniach mobilnych jeśli chcesz
                return window.innerWidth < 768;
            }
        });
        
        console.log('AOS zainicjalizowane');
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
     * Init viewer.js
     */
    initViewer() {
        const lightBoxes = document.querySelectorAll('.viewer-js');
        if (lightBoxes.length > 0 && typeof window.Viewer === 'function') {
            lightBoxes.forEach(lightBox => {
                const viewer = new Viewer(lightBox, {
                    title: false,
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
        this.initViewer();
        this.activeClassToggler();
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
 