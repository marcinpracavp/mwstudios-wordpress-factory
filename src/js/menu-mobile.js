class MenuMobile {
    constructor(element) {
        this.element = element;
        this.menu = element.querySelector('.c-menu-mobile__menu');
        this.toggler = element.querySelector('.c-menu-mobile__toggler');
        this.mobileBreakpoint = window.matchMedia ? window.matchMedia('(max-width: 992px)') : null;

        if (!this.menu || !this.toggler) return;

        this.addSubmenuToggles();
        this.toggler.addEventListener('click', () => this.toggle());
        this.menu.addEventListener('click', (event) => {
            if (event.target === this.menu) this.close();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.close();
        });
        if (this.mobileBreakpoint) {
            const handleBreakpointChange = (event) => {
                if (!event.matches) this.close();
            };
            if (typeof this.mobileBreakpoint.addEventListener === 'function') {
                this.mobileBreakpoint.addEventListener('change', handleBreakpointChange);
            } else if (typeof this.mobileBreakpoint.addListener === 'function') {
                this.mobileBreakpoint.addListener(handleBreakpointChange);
            }
        }
    }

    addSubmenuToggles() {
        this.menu.querySelectorAll('.menu-item-has-children').forEach((item) => {
            const children = Array.from(item.children);
            const link = children.find((child) => child.matches('a'));
            const submenu = children.find((child) => child.matches('.sub-menu'));
            if (!link || !submenu) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'c-menu-mobile__submenu-toggle';
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-label', `Rozwiń podmenu: ${link.textContent.trim()}`);
            button.innerHTML = '<span aria-hidden="true"></span>';
            submenu.hidden = true;
            link.after(button);

            button.addEventListener('click', () => {
                const isOpen = button.getAttribute('aria-expanded') === 'true';
                button.setAttribute('aria-expanded', String(!isOpen));
                submenu.hidden = isOpen;
                item.classList.toggle('is-open', !isOpen);
            });
        });
    }

    toggle() {
        if (this.menu.hidden) {
            this.open();
        } else {
            this.close();
        }
    }

    open() {
        this.menu.hidden = false;
        this.menu.classList.add('is-active');
        this.toggler.classList.add('is-open');
        this.toggler.setAttribute('aria-expanded', 'true');
        this.toggler.setAttribute('aria-label', 'Zamknij menu');
        document.body.classList.add('mobile-menu-open');
    }

    close() {
        if (this.menu.hidden) return;

        this.menu.classList.remove('is-active');
        this.toggler.classList.remove('is-open');
        this.toggler.setAttribute('aria-expanded', 'false');
        this.toggler.setAttribute('aria-label', 'Otwórz menu');
        document.body.classList.remove('mobile-menu-open');
        window.setTimeout(() => {
            if (!this.menu.classList.contains('is-active')) this.menu.hidden = true;
        }, 300);
    }
}

const initMobileMenus = () => {
    document.querySelectorAll('.js-menu-mobile').forEach((element) => new MenuMobile(element));
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenus, { once: true });
} else {
    initMobileMenus();
}
