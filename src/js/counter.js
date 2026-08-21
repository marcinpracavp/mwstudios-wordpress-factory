/**
 * Animowany licznik - odlicza od 0 do docelowej wartości
 * Rozpoczyna się gdy element staje się widoczny w viewport
 * <span class="counter" 
      data-counter="50000" 
      data-duration="3000" 
      data-thousands="true"
      data-suffix="+">0</span>

<!-- Z prefiksem -->
<span class="counter" 
      data-counter="99" 
      data-prefix="$"
      data-duration="1500">0</span>
 */

class AnimatedCounter {
    constructor() {
        this.counters = document.querySelectorAll('[data-counter]');
        this.observer = null;
        this.init();
    }

    init() {
        if (this.counters.length === 0) return;
        
        this.setupIntersectionObserver();
        this.observeCounters();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.5, // Element musi być widoczny w 50%
            rootMargin: '0px 0px -50px 0px' // Trigger trochę wcześniej
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startCounting(entry.target);
                    this.observer.unobserve(entry.target); // Liczy tylko raz
                }
            });
        }, options);
    }

    observeCounters() {
        this.counters.forEach(counter => {
            this.observer.observe(counter);
        });
    }

    startCounting(element) {
        const targetValue = parseInt(element.dataset.counter) || 0;
        const duration = parseInt(element.dataset.counterDuration || element.dataset.duration) || 2000; // obsługa obu nazw
        const startValue = 0;
        
        // Dodaj klasę CSS dla dodatkowych efektów
        element.classList.add('counting');
        
        // Animacja liczenia
        this.animateValue(element, startValue, targetValue, duration);
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function - ease-out dla płynniejszego efektu
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.floor(start + (difference * easedProgress));
            
            // Formatowanie liczby (opcjonalne separatory tysięcy)
            const formattedValue = this.formatNumber(currentValue, element);
            element.textContent = formattedValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            } else {
                // Animacja zakończona
                element.classList.add('counting-complete');
                element.classList.remove('counting');
                
                // Trigger custom event
                element.dispatchEvent(new CustomEvent('counterComplete', {
                    detail: { finalValue: end }
                }));
            }
        };

        requestAnimationFrame(updateValue);
    }

    formatNumber(number, element) {
        const useThousandsSeparator = element.dataset.thousands === 'true';
        const suffix = element.dataset.suffix || '';
        const prefix = element.dataset.prefix || '';
        
        let formatted = number.toString();
        
        if (useThousandsSeparator && number >= 1000) {
            formatted = number.toLocaleString('pl-PL');
        }
        
        return prefix + formatted + suffix;
    }

    // Metoda do ręcznego uruchomienia licznika
    triggerCounter(selector) {
        const element = document.querySelector(selector);
        if (element && this.observer) {
            this.observer.unobserve(element);
            this.startCounting(element);
        }
    }

    // Metoda do resetowania licznika
    resetCounter(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = '0';
            element.classList.remove('counting', 'counting-complete');
            if (this.observer) {
                this.observer.observe(element);
            }
        }
    }
}

// Auto-inicjalizacja gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', () => {
    window.animatedCounter = new AnimatedCounter();
});

// Export dla użycia w innych modułach
export default AnimatedCounter;
