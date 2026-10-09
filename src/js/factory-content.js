// Shared progressive enhancement. Accordion uses native details/summary.
function initTabs(root) {
    const list = Array.from(root.children).find(el => el.hasAttribute('data-mwf-tablist'));
    const panels = Array.from(root.children).filter(el => el.hasAttribute('data-mwf-panel'));
    if (!list || panels.length < 2) return;
    const buttons = Array.from(list.querySelectorAll('[data-mwf-tab]'));
    list.hidden = false;
    list.setAttribute('role', 'tablist');
    const activate = index => {
        buttons.forEach((button, i) => {
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', String(i === index));
            button.tabIndex = i === index ? 0 : -1;
            panels[i].hidden = i !== index;
            panels[i].setAttribute('role', 'tabpanel');
            panels[i].setAttribute('aria-labelledby', button.id);
            panels[i].tabIndex = 0;
            const heading = Array.from(panels[i].children).find(el => el.hasAttribute('data-mwf-panel-heading'));
            if (heading) heading.hidden = true;
        });
    };
    buttons.forEach((button, i) => {
        button.addEventListener('click', () => activate(i));
        button.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight') next = (i + 1) % buttons.length;
            if (event.key === 'ArrowLeft') next = (i - 1 + buttons.length) % buttons.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = buttons.length - 1;
            if (next !== undefined) {
                event.preventDefault();
                activate(next);
                buttons[next].focus();
            }
        });
    });
    activate(0);
}

function initSlider(root) {
    const slides = Array.from(root.querySelectorAll('[data-mwf-slide]'));
    const controls = root.querySelector('[data-mwf-slider-controls]');
    if (slides.length < 2 || !controls) return;
    const previous = controls.querySelector('[data-mwf-prev]');
    const next = controls.querySelector('[data-mwf-next]');
    const status = controls.querySelector('[data-mwf-slider-status]');
    if (!previous || !next || !status) return;
    let active = 0;
    const show = index => {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
            slide.hidden = i !== active;
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'slajd');
            slide.setAttribute('aria-label', `${i + 1} z ${slides.length}`);
        });
        status.textContent = `Slajd ${active + 1} z ${slides.length}`;
    };
    controls.hidden = false;
    previous.addEventListener('click', () => show(active - 1));
    next.addEventListener('click', () => show(active + 1));
    controls.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        show(active + (event.key === 'ArrowLeft' ? -1 : 1));
    });
    show(0); // Deliberately manual; no automatic motion or pause control needed.
}

function initNavigation(root) {
    const menu = root.querySelector(':scope > ul');
    const toggle = root.querySelector('[data-mwf-menu-toggle]');
    if (!menu || !toggle) return;
    const small = window.matchMedia('(max-width: 992px)');
    root.classList.add('is-enhanced');
    const entries = [];
    root.querySelectorAll('li').forEach((item, index) => {
        const submenu = Array.from(item.children).find(el => el.tagName === 'UL');
        const link = Array.from(item.children).find(el => el.tagName === 'A');
        if (!submenu || !link) return;
        submenu.id = submenu.id || `${menu.id}-sub-${index}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mwf-nav__submenu-toggle';
        button.textContent = '⌄';
        button.setAttribute('aria-label', `Podmenu: ${link.textContent.trim()}`);
        button.setAttribute('aria-controls', submenu.id);
        button.setAttribute('aria-expanded', 'false');
        link.after(button);
        const close = () => { submenu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
        close();
        button.addEventListener('click', () => {
            const open = submenu.hidden;
            submenu.hidden = !open;
            button.setAttribute('aria-expanded', String(open));
        });
        item.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !submenu.hidden) {
                event.preventDefault(); event.stopPropagation(); close(); button.focus();
            }
        });
        item.addEventListener('focusout', event => { if (!item.contains(event.relatedTarget)) close(); });
        entries.push({ item, close });
    });
    const closeMenu = () => {
        menu.hidden = small.matches;
        toggle.setAttribute('aria-expanded', 'false');
        entries.forEach(entry => entry.close());
    };
    const responsive = () => { toggle.hidden = !small.matches; closeMenu(); };
    toggle.addEventListener('click', () => {
        menu.hidden = !menu.hidden;
        toggle.setAttribute('aria-expanded', String(!menu.hidden));
    });
    root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && small.matches && !menu.hidden) {
            event.preventDefault(); closeMenu(); toggle.focus();
        }
    });
    document.addEventListener('click', event => {
        if (!root.contains(event.target)) closeMenu();
    });
    small.addEventListener('change', responsive);
    responsive();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mwf-tabs]').forEach(initTabs);
    document.querySelectorAll('[data-mwf-slider]').forEach(initSlider);
    document.querySelectorAll('[data-mwf-nav]').forEach(initNavigation);
});
