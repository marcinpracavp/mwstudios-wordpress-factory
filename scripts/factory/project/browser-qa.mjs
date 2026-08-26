import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [url, widthValue, viewportHeightValue, outputFile] = process.argv.slice(2);

if (!url || !widthValue || !viewportHeightValue || !outputFile) {
    throw new Error('Usage: node browser-qa.mjs <url> <width> <viewport-height> <output-file>');
}

const chromePath = process.env.AURA_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const width = Number(widthValue);
const viewportHeight = Number(viewportHeightValue);
const port = 9337;
const profile = path.join(process.env.TEMP || '.', 'aura-browser-qa');
const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
], { windowsHide: true, stdio: 'ignore' });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForEndpoint(endpoint, attempts = 80) {
    for (let index = 0; index < attempts; index += 1) {
        try {
            const response = await fetch(endpoint, { method: endpoint.includes('/json/new') ? 'PUT' : 'GET' });
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            // Chrome is still starting.
        }
        await delay(100);
    }
    throw new Error(`Chrome DevTools endpoint unavailable: ${endpoint}`);
}

function createCdpClient(webSocketUrl) {
    const socket = new WebSocket(webSocketUrl);
    const pending = new Map();
    const events = new Map();
    let commandId = 0;

    socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        if (message.id && pending.has(message.id)) {
            const { resolve, reject } = pending.get(message.id);
            pending.delete(message.id);
            if (message.error) reject(new Error(message.error.message));
            else resolve(message.result);
            return;
        }
        (events.get(message.method) || []).forEach((handler) => handler(message.params));
    });

    return {
        ready: new Promise((resolve, reject) => {
            socket.addEventListener('open', resolve, { once: true });
            socket.addEventListener('error', reject, { once: true });
        }),
        send(method, params = {}) {
            commandId += 1;
            return new Promise((resolve, reject) => {
                pending.set(commandId, { resolve, reject });
                socket.send(JSON.stringify({ id: commandId, method, params }));
            });
        },
        once(method) {
            return new Promise((resolve) => {
                const handler = (params) => {
                    events.set(method, (events.get(method) || []).filter((item) => item !== handler));
                    resolve(params);
                };
                events.set(method, [...(events.get(method) || []), handler]);
            });
        },
        on(method, handler) {
            events.set(method, [...(events.get(method) || []), handler]);
        },
        close() {
            socket.close();
        },
    };
}

let client;

try {
    await waitForEndpoint(`http://127.0.0.1:${port}/json/version`);
    const target = await waitForEndpoint(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`);
    client = createCdpClient(target.webSocketDebuggerUrl);
    await client.ready;

    const consoleErrors = [];
    client.on('Runtime.exceptionThrown', ({ exceptionDetails }) => consoleErrors.push(exceptionDetails.text));
    client.on('Log.entryAdded', ({ entry }) => {
        if (entry.level === 'error') consoleErrors.push(entry.text);
    });

    await Promise.all([
        client.send('Page.enable'),
        client.send('Runtime.enable'),
        client.send('Log.enable'),
        client.send('Emulation.setDeviceMetricsOverride', {
            width,
            height: viewportHeight,
            deviceScaleFactor: 1,
            mobile: false,
        }),
    ]);

    const loaded = client.once('Page.loadEventFired');
    await client.send('Page.navigate', { url });
    await loaded;
    await client.send('Runtime.evaluate', {
        expression: `Promise.all([
            document.fonts.ready,
            (async () => {
                document.querySelectorAll('img[loading="lazy"]').forEach((image) => image.loading = 'eager');
                window.scrollTo(0, document.documentElement.scrollHeight);
                await new Promise((resolve) => setTimeout(resolve, 1500));
                window.scrollTo(0, 0);
            })()
        ])`,
        awaitPromise: true,
        returnByValue: true,
    });
    await delay(750);

    const evaluation = await client.send('Runtime.evaluate', {
        expression: `({
            url: location.href,
            title: document.title,
            viewport: { width: innerWidth, height: innerHeight },
            document: {
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight
            },
            phpWarnings: /Warning:|Fatal error|Notice:/.test(document.body.innerText),
            lenis: Boolean(window.auraLenis),
            initializedSwipers: document.querySelectorAll('.swiper-initialized').length,
            menu: Boolean(document.querySelector('[data-aura-menu-toggle]')),
            search: Boolean(document.querySelector('[data-aura-search]')),
			functional: (() => {
				const result = { menuToggle: null, searchOverlay: null, stickyCart: Boolean(document.querySelector('[data-aura-sticky-cart]')) };
				const menuToggle = document.querySelector('[data-aura-menu-toggle]');
				const mobileMenu = document.querySelector('[data-aura-mobile-menu]');
				if (menuToggle && mobileMenu) { menuToggle.click(); result.menuToggle = !mobileMenu.hidden; menuToggle.click(); }
				const searchOpen = document.querySelector('[data-aura-search-open]');
				const search = document.querySelector('[data-aura-search]');
				const searchClose = document.querySelector('[data-aura-search-close]');
				if (searchOpen && search && searchClose) { searchOpen.click(); result.searchOverlay = !search.hidden; searchClose.click(); }
				return result;
			})(),
            emptySections: Array.from(document.querySelectorAll('section')).filter((section) => !section.textContent.trim() && !section.querySelector('img, form, video')).length,
			overflowingElements: Array.from(document.querySelectorAll('body *')).map((node) => ({
				selector: [node.tagName.toLowerCase(), node.id ? '#' + node.id : '', typeof node.className === 'string' && node.className ? '.' + node.className.trim().split(/\\s+/).join('.') : ''].join(''),
				left: Math.round(node.getBoundingClientRect().left),
				right: Math.round(node.getBoundingClientRect().right)
			})).filter((node) => node.left < -1 || node.right > innerWidth + 1).slice(0, 20),
            blocks: Array.from(document.querySelectorAll('body > .aura-announcement, body > .aura-header, main > section, body > .aura-newsletter, body > .aura-footer')).map((node) => ({
                className: node.className,
                top: Math.round(node.getBoundingClientRect().top + scrollY),
                height: Math.round(node.getBoundingClientRect().height)
            }))
        })`,
        returnByValue: true,
    });

    const metrics = await client.send('Page.getLayoutMetrics');
    const contentSize = metrics.cssContentSize;
    const screenshot = await client.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height: contentSize.height, scale: 1 },
    });
    await mkdir(path.dirname(path.resolve(outputFile)), { recursive: true });
    await writeFile(outputFile, Buffer.from(screenshot.data, 'base64'));

    process.stdout.write(JSON.stringify({
        ...evaluation.result.value,
        screenshot: path.resolve(outputFile),
        consoleErrors,
    }, null, 2));
} finally {
    client?.close();
    chrome.kill();
}
