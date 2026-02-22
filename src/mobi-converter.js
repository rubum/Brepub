
import { initKf8File, initMobiFile } from '@lingo-reader/mobi-parser';
import JSZip from 'jszip';

export class MobiConverter {
    async convert(file) {
        let parser;
        const fileName = file.name || '';

        if (fileName.toLowerCase().endsWith('.azw3')) {
            parser = await initKf8File(file);
        } else {
            parser = await initMobiFile(file);
        }

        const metadata = parser.getMetadata();
        const title = metadata.title || 'Converted Book';
        const author = Array.isArray(metadata.author) ? metadata.author.join(', ') : (metadata.author || 'Unknown Author');

        const zip = new JSZip();

        // 1. Mimetype
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // 2. container.xml
        zip.folder('META-INF').file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);

        // 3. Content
        const oebps = zip.folder('OEBPS');
        const textFolder = oebps.folder('Text');

        const spine = parser.getSpine();
        const manifestItems = [];
        const spineItems = [];

        for (let i = 0; i < spine.length; i++) {
            const item = spine[i];
            const fileName = `chapter_${i}.xhtml`;

            // loadChapter returns { html, css } for both Mobi and Kf8
            const processed = parser.loadChapter(item.id);
            if (!processed) continue;

            // Basic wrap for EPUB 3
            const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>${this.escapeHtml(title)}</title>
</head>
<body>
    ${processed.html}
</body>
</html>`;
            textFolder.file(fileName, xhtml);

            const manifestId = `item_${i}`;
            manifestItems.push(`<item id="${manifestId}" href="Text/${fileName}" media-type="application/xhtml+xml"/>`);
            spineItems.push(`<itemref idref="${manifestId}"/>`);
        }

        // 4. content.opf
        const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="pub-id">urn:uuid:${crypto.randomUUID()}</dc:identifier>
        <dc:title>${this.escapeHtml(title)}</dc:title>
        <dc:creator>${this.escapeHtml(author)}</dc:creator>
        <dc:language>${metadata.language || 'en'}</dc:language>
        <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
    </metadata>
    <manifest>
        ${manifestItems.join('\n        ')}
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    </manifest>
    <spine>
        ${spineItems.join('\n        ')}
    </spine>
</package>`;
        oebps.file('content.opf', opf);

        // 5. nav.xhtml (Required for EPUB 3)
        const nav = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Navigation</title></head>
<body>
    <nav epub:type="toc">
        <h1>Table of Contents</h1>
        <ol>
            ${spine.map((_, i) => `<li><a href="Text/chapter_${i}.xhtml">Chapter ${i + 1}</a></li>`).join('\n            ')}
        </ol>
    </nav>
</body>
</html>`;
        oebps.file('nav.xhtml', nav);

        return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
