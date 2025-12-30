const puppeteer = require('puppeteer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ExportService {
    constructor(dbManager) {
        this.db = dbManager;
    }

    /**
     * Export a wiki page as Markdown
     * @param {number|string} pageId 
     * @returns {Promise<{content: string, filename: string}>}
     */
    async exportToMarkdown(pageId) {
        const page = await this.db.wikiPages.findWikiPageById(pageId);

        if (!page) {
            throw new Error('Page not found');
        }

        const content = `# ${page.title}\n\n${page.content}\n\n---\n*Exported from Open Book Wiki*\n*Last updated: ${page.updated_at}*`;
        const filename = `${this.sanitizeFilename(page.title)}.md`;

        return { content, filename };
    }

    /**
     * Export a wiki page as HTML
     * @param {number|string} pageId 
     * @returns {Promise<{content: string, filename: string}>}
     */
    async exportToHTML(pageId) {
        const page = await this.db.wikiPages.findWikiPageById(pageId);

        if (!page) {
            throw new Error('Page not found');
        }

        // Convert markdown to HTML (simple conversion, you can use markdown-it for better results)
        const htmlContent = this.markdownToHTML(page.content);

        const content = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }
        h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1rem;
            margin-left: 0;
            color: #666;
        }
        .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>${page.title}</h1>
    ${htmlContent}
    <div class="footer">
        <p><em>Exported from Open Book Wiki</em></p>
        <p><em>Last updated: ${new Date(page.updated_at).toLocaleString('fr-FR')}</em></p>
    </div>
</body>
</html>`;

        const filename = `${this.sanitizeFilename(page.title)}.html`;
        return { content, filename };
    }

    /**
     * Export a wiki page as PDF
     * @param {number|string} pageId 
     * @returns {Promise<{buffer: Buffer, filename: string}>}
     */
    async exportToPDF(pageId) {
        const { content: htmlContent } = await this.exportToHTML(pageId);
        const page = await this.db.wikiPages.findWikiPageById(pageId);

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const browserPage = await browser.newPage();
            await browserPage.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfBuffer = await browserPage.pdf({
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                },
                printBackground: true
            });

            const filename = `${this.sanitizeFilename(page.title)}.pdf`;
            return { buffer: pdfBuffer, filename };

        } catch (error) {
            logger.error('Error generating PDF', error instanceof Error ? error.message : String(error));
            throw new Error('Failed to generate PDF');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Export multiple pages as a ZIP archive
     * @param {Array<number|string>} pageIds 
     * @param {string} format - 'markdown', 'html', or 'pdf'
     * @returns {Promise<{stream: archiver.Archiver, filename: string}>}
     */
    async exportBulk(pageIds, format = 'markdown') {
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `wiki-export-${timestamp}.zip`;

        for (const pageId of pageIds) {
            try {
                if (format === 'pdf') {
                    const { buffer, filename: pdfFilename } = await this.exportToPDF(pageId);
                    archive.append(buffer, { name: pdfFilename });
                } else if (format === 'html') {
                    const { content, filename: htmlFilename } = await this.exportToHTML(pageId);
                    archive.append(content, { name: htmlFilename });
                } else {
                    const { content, filename: mdFilename } = await this.exportToMarkdown(pageId);
                    archive.append(content, { name: mdFilename });
                }
            } catch (error) {
                logger.error(`Error exporting page ${pageId}`, error instanceof Error ? error.message : String(error));
                // Continue with other pages
            }
        }

        archive.finalize();
        return { stream: archive, filename };
    }

    /**
     * Simple markdown to HTML conversion
     * @param {string} markdown 
     * @returns {string}
     */
    markdownToHTML(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Code blocks
        html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Wrap in paragraphs
        html = '<p>' + html + '</p>';

        return html;
    }

    /**
     * Sanitize filename for safe file system usage
     * @param {string} filename 
     * @returns {string}
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
    }
}

module.exports = ExportService;
