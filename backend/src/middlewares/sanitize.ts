import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

const allowedSchemes = ['http:', 'https:', 'mailto:'];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName === 'A') {
        const href = node.getAttribute('href') || '';
        try {
            const url = new URL(href, 'http://dummy.base'); // база нужна для относительных ссылок
            if (!allowedSchemes.includes(url.protocol)) {
                node.removeAttribute('href');
            }
        } catch {
            node.removeAttribute('href');
        }
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
    }
});

export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br'],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    });
}
