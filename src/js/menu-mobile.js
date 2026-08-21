(function($) {
    class MenuMobile {
        constructor(element) {
            this.element = element;
            this.menuIsActive = false;
            this.menu = element.querySelector('.c-menu-mobile__menu');
            this.toggler = element.querySelector('.c-menu-mobile__toggler');
    
            this.toggler.addEventListener('click', () => this.toggleMenu());
        }
    
        toggleMenu() {
            this.menu.classList.toggle('is-active');
            this.toggler.classList.toggle('is-open');
            this.menuIsActive = !this.menuIsActive;
    
            this.toggleOverflow();
        }
    
        toggleOverflow() {
            // Calculate scrollbar width by comparing window inner width with document client width
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            if (this.menuIsActive) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            } else {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
            }
        }
    }
    const baseUrl = `/wp-content/themes/izolmaster`;
    
    document.addEventListener('DOMContentLoaded', () => {2
        const element = document.querySelector('.js-menu-mobile');
        if (element) {
            new MenuMobile(element);
            $('.menu-item-has-children > a').append(`<span class="dropdown-toggle"><img src="${baseUrl}/dist/img/menu-arrow.svg"></img></span>`);

        }
    });
    
    // menu mobile rozwijanie
    $(document).ready(function(){

        // Add hover event for desktop menu
        if (!window.matchMedia('(max-width: 1199px)').matches) {
            $('.menu-item-has-children').hover(
                function() {
                    // Mouse enter
                    $(this).find('ul.sub-menu').css('display', 'flex');
                }, 
                function() {
                    // Mouse leave
                    $(this).find('ul.sub-menu').css('display', '');
                }
            );
        }

        if (window.matchMedia('(max-width: 991px)').matches) {
            // Dodaj kliwalny element span do każdego linku z submenu
    
            $('.menu-item-has-children > a').each(function(){
                var wasOpened = false;
    
                // Obsługa kliknięcia na strzałkę
                $(this).find('.dropdown-toggle').on('click', function(e){
                    e.stopPropagation(); // Zapobiegaj propagacji, aby nie uruchomić zdarzenia kliknięcia na <a>
                    e.preventDefault();
                    $(this).parent().next('.sub-menu').slideToggle('slow');
                    $(this).parent().toggleClass('active');
                    wasOpened = !wasOpened;
                });
    
                // Obsługa kliknięcia na link
                $(this).on('click', function(e){
                    if (!wasOpened) {
                        e.preventDefault();
                        $(this).find('.dropdown-toggle').trigger('click'); // Symulacja kliknięcia na strzałkę
                    } else {
                        window.location.href = $(this).attr('href'); // Przejdź do linku
                    }
                });
    
                // Dodaj obsługę kliknięcia poza menu, aby resetować flagę
                $(document).on('click', function outsideClick(e){
                    if (!$(e.target).closest('.menu-item-has-children').length) {
                        wasOpened = false;
                        $('.sub-menu').slideUp('slow'); // Zamknij wszystkie sub-menu
                        $('.menu-item-has-children > a').removeClass('active');
                    }
                });
            });
        }
    });
})(jQuery);