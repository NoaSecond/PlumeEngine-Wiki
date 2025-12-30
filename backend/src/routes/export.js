const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ExportService = require('../services/export-service');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Wiki page export functionality
 */

/**
 * @swagger
 * /export/{pageId}/markdown:
 *   get:
 *     summary: Export a wiki page as Markdown
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The page ID
 *     responses:
 *       200:
 *         description: Markdown file download
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.get('/:pageId/markdown', requireAuth, async (req, res) => {
    try {
        const pageId = req.params.pageId;
        const exportService = new ExportService(req.db);

        const { content, filename } = await exportService.exportToMarkdown(pageId);

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    } catch (error) {
        console.error('Error exporting to Markdown:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error exporting page'
        });
    }
});

/**
 * @swagger
 * /export/{pageId}/html:
 *   get:
 *     summary: Export a wiki page as HTML
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The page ID
 *     responses:
 *       200:
 *         description: HTML file download
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.get('/:pageId/html', requireAuth, async (req, res) => {
    try {
        const pageId = req.params.pageId;
        const exportService = new ExportService(req.db);

        const { content, filename } = await exportService.exportToHTML(pageId);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    } catch (error) {
        console.error('Error exporting to HTML:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error exporting page'
        });
    }
});

/**
 * @swagger
 * /export/{pageId}/pdf:
 *   get:
 *     summary: Export a wiki page as PDF
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The page ID
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.get('/:pageId/pdf', requireAuth, async (req, res) => {
    try {
        const pageId = req.params.pageId;
        const exportService = new ExportService(req.db);

        const { buffer, filename } = await exportService.exportToPDF(pageId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error exporting page'
        });
    }
});

/**
 * @swagger
 * /export/bulk:
 *   post:
 *     summary: Export multiple wiki pages as a ZIP archive
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pageIds
 *               - format
 *             properties:
 *               pageIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of page IDs to export
 *               format:
 *                 type: string
 *                 enum: [markdown, html, pdf]
 *                 description: Export format
 *     responses:
 *       200:
 *         description: ZIP file download
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/bulk', requireAuth, async (req, res) => {
    try {
        const { pageIds, format } = req.body;

        if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'pageIds array is required'
            });
        }

        if (!['markdown', 'html', 'pdf'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'format must be markdown, html, or pdf'
            });
        }

        const exportService = new ExportService(req.db);
        const { stream, filename } = await exportService.exportBulk(pageIds, format);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        stream.pipe(res);
    } catch (error) {
        console.error('Error bulk exporting:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error exporting pages'
        });
    }
});

module.exports = router;
