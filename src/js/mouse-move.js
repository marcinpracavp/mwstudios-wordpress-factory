/**
     * Inicjalizuje efekt parallax na określonej sekcji z indywidualną konfiguracją dla poszczególnych elementów.
     *
     * @param {string} containerSelector - Selektor kontenera (sekcji).
     * @param {Array} elementsConfig - Tablica konfiguracji elementów. Każdy obiekt powinien zawierać:
     *    - selector: selektor elementu (w obrębie kontenera),
     *    - direction: 'normal' | 'reverse' | 'reverse-x' | 'reverse-y' | 'random',
     *    - multiplier: mnożnik przesunięcia dla tego elementu (np. 5, 10, …).
     */
function initParallax(containerSelector, elementsConfig) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn(`Nie znaleziono elementu dla selektora: ${containerSelector}`);
      return;
    }
    const parallaxElements = [];
    
    // Dla każdej konfiguracji pobieramy elementy i zapisujemy ich bazowy styl transform oraz ustawiamy czynniki przesunięcia
    elementsConfig.forEach(config => {
      const elems = container.querySelectorAll(config.selector);
      // Używamy mnożnika z konfiguracji lub domyślnie 10
      const configMultiplier = config.multiplier !== undefined ? config.multiplier : 10;
      elems.forEach(el => {
        const compStyle = window.getComputedStyle(el);
        let baseTransform = compStyle.transform;
        if (baseTransform === 'none') {
          baseTransform = '';
        }
        
        let factorX = 1, factorY = 1;
        switch (config.direction) {
          case 'reverse':
            factorX = -1;
            factorY = -1;
            break;
          case 'reverse-x':
            factorX = -1;
            factorY = 1;
            break;
          case 'reverse-y':
            factorX = 1;
            factorY = -1;
            break;
          case 'random':
            factorX = Math.random() < 0.5 ? 1 : -1;
            factorY = Math.random() < 0.5 ? 1 : -1;
            break;
          default:
            factorX = 1;
            factorY = 1;
        }
        
        parallaxElements.push({
          el: el,
          baseTransform: baseTransform,
          factorX: factorX,
          factorY: factorY,
          multiplier: configMultiplier
        });
      });
    });
    
    // Aktualizacja transformacji elementów na podstawie pozycji kursora w kontenerze
    container.addEventListener('mousemove', function(e) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;
      
      parallaxElements.forEach(item => {
        const offsetX = deltaX * item.multiplier * item.factorX;
        const offsetY = deltaY * item.multiplier * item.factorY;
        item.el.style.transform = item.baseTransform + ` translate(${offsetX}px, ${offsetY}px)`;
      });
    });
    
    // Po opuszczeniu kontenera nie resetujemy transformacji – efekt zostaje utrwalony
    // container.addEventListener('mouseleave', function() {
    //   parallaxElements.forEach(item => {
    //     item.el.style.transform = item.baseTransform;
    //   });
    // });
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    // Konfiguracja efektu parallax dla poszczególnych elementów
    // initParallax('.home .hero', [
    //   { selector: '.hero-container__image1', direction: 'normal', multiplier: 4 },
    //   { selector: '.hero-container__image2', direction: 'reverse', multiplier: 9 }
    // ]);
  });