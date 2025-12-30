const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all wiki pages
router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const pages = await db.wikiPages.getAllWikiPages();

    res.json({
      success: true,
      pages: pages
    });

  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a wiki page by title or ID
router.get('/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const db = req.db;

    // Try ID first if it looks like a number, then Title
    let page = null;
    if (/^\d+$/.test(title)) {
      page = await db.wikiPages.findWikiPageById(parseInt(title, 10));
    }

    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(title);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      page: page
    });

  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get page history
/**
 * @swagger
 * /wiki/{id}/history:
 *   get:
 *     summary: Get the history of a wiki page
 *     tags: [Wiki]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The page ID
 *     responses:
 *       200:
 *         description: List of history entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       changed_at:
 *                         type: string
 *                         format: date-time
 *                       title:
 *                         type: string
 *                       changed_by_username:
 *                         type: string
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.get('/:id/history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || req.params.id;
    const db = req.db;

    // Resolve page ID
    let page = await db.wikiPages.findWikiPageById(id);
    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(id);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const history = await db.wikiPages.getHistoryForPage(page.id);

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific history version
/**
 * @swagger
 * /wiki/{id}/history/{historyId}:
 *   get:
 *     summary: Get a specific historical version of a page
 *     tags: [Wiki]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The page ID
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The history entry ID
 *     responses:
 *       200:
 *         description: Detailed history entry with content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 version:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     content:
 *                       type: string
 *                     title:
 *                       type: string
 *                     changed_at:
 *                       type: string
 *                     changed_by_username:
 *                       type: string
 *       404:
 *         description: Version not found
 *       500:
 *         description: Server error
 */
router.get('/:id/history/:historyId', async (req, res) => {
  try {
    const historyId = req.params.historyId;
    const db = req.db;

    const version = await db.wikiPages.getHistoryDetail(historyId);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      version: version
    });

  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create a new wiki page
router.post('/', requireAuth, requirePermission('create_pages'), async (req, res) => {
  try {
    const { title, content, isProtected = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content required'
      });
    }

    const db = req.db;

    // Check if page already exists
    const existingPage = await db.wikiPages.findWikiPageByTitle(title);
    if (existingPage) {
      return res.status(409).json({
        success: false,
        message: 'A page with this title already exists'
      });
    }

    const pageId = await db.wikiPages.createWikiPage({
      title,
      content,
      authorId: req.user.userId,
      isProtected,
      icon: req.body.icon
    });

    // Create a page creation activity
    await db.activities.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: 'Page created',
      description: `Created page "${title}"`,
      icon: 'file-plus',
      metadata: { pageTitle: title, pageId }
    });

    const newPage = await db.wikiPages.findWikiPageByTitle(title);

    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      page: newPage
    });

  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update a wiki page
router.put('/:id', requireAuth, requirePermission('edit_pages'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || req.params.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content required'
      });
    }

    const db = req.db;

    // Check that the page exists (try ID first, then Title for legacy)
    let page = await db.wikiPages.findWikiPageById(id);
    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(id);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Check protection
    if (page.is_protected) {
      const permissions = await db.tags.getUserPermissions(req.user.userId);
      const hasProtectPermission = permissions.some(p => p.name === 'protect_pages');

      if (!req.user.isAdmin && !hasProtectPermission) {
        return res.status(403).json({
          success: false,
          message: 'This page is protected. You need "protect_pages" permission to edit it.'
        });
      }
    }

    await db.wikiPages.updateWikiPage(page.id, { content, icon: req.body.icon }, req.user.userId);

    // Create a page modification activity
    await db.activities.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: 'Page modified',
      description: `Modified page "${page.title}"`,
      icon: 'edit',
      metadata: { pageTitle: page.title, pageId: page.id }
    });

    const updatedPage = await db.wikiPages.findWikiPageByTitle(page.title);

    res.json({
      success: true,
      message: 'Page updated successfully',
      page: updatedPage
    });

  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Rename a wiki page
router.put('/:id/rename', requireAuth, requirePermission('edit_pages'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'New title required'
      });
    }

    const db = req.db;

    // Check that the page exists (try ID first, then Title for legacy)
    let page = await db.wikiPages.findWikiPageById(id);
    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(id);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Check protection
    if (page.is_protected) {
      const permissions = await db.tags.getUserPermissions(req.user.userId);
      const hasProtectPermission = permissions.some(p => p.name === 'protect_pages');

      if (!req.user.isAdmin && !hasProtectPermission) {
        return res.status(403).json({
          success: false,
          message: 'This page is protected. You need "protect_pages" permission to rename it.'
        });
      }
    }

    // Check if a page with the new title already exists
    const existingPage = await db.wikiPages.findWikiPageByTitle(title);
    if (existingPage && existingPage.id !== page.id) {
      return res.status(409).json({
        success: false,
        message: 'A page with this title already exists'
      });
    }

    await db.wikiPages.renameWikiPage(page.id, title);

    // Create a page rename activity
    await db.activities.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: 'Page renamed',
      description: `Renamed page "${page.title}" to "${title}"`,
      icon: 'edit',
      metadata: { oldTitle: page.title, newTitle: title, pageId: page.id }
    });

    const renamedPage = await db.wikiPages.findWikiPageById(page.id);

    res.json({
      success: true,
      message: 'Page renamed successfully',
      page: renamedPage
    });

  } catch (error) {
    console.error('Error renaming page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Protect/Unprotect a wiki page
router.put('/:id/protect', requireAuth, requirePermission('protect_pages'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || req.params.id;
    const { isProtected } = req.body;

    if (isProtected === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isProtected status required'
      });
    }

    const db = req.db;

    // Check that the page exists
    let page = await db.wikiPages.findWikiPageById(id);
    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(id);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    await db.wikiPages.updateWikiPageProtection(page.id, isProtected);

    // Activity log
    await db.activities.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: isProtected ? 'Page protected' : 'Page unprotected',
      description: `${isProtected ? 'Protected' : 'Unprotected'} page "${page.title}"`,
      icon: isProtected ? 'lock' : 'unlock',
      metadata: { pageTitle: page.title, pageId: page.id }
    });

    res.json({
      success: true,
      message: `Page ${isProtected ? 'protected' : 'unprotected'} successfully`,
      isProtected
    });

  } catch (error) {
    console.error('Error protecting page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a wiki page
router.delete('/:id', requireAuth, requirePermission('delete_pages'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || req.params.id;
    const db = req.db;

    // Check that the page exists (try ID first, then Title)
    let page = await db.wikiPages.findWikiPageById(id);
    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(id);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Check protection
    if (page.is_protected) {
      const permissions = await db.tags.getUserPermissions(req.user.userId);
      const hasProtectPermission = permissions.some(p => p.name === 'protect_pages');

      if (!req.user.isAdmin && !hasProtectPermission) {
        return res.status(403).json({
          success: false,
          message: 'This page is protected. You need "protect_pages" permission to delete it.'
        });
      }
    }

    await db.wikiPages.deleteWikiPage(page.id);

    // Create a page deletion activity
    await db.activities.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: 'Page deleted',
      description: `Deleted page "${page.title}"`,
      icon: 'trash-2',
      metadata: { pageTitle: page.title, pageId: page.id }
    });

    res.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /wiki/{id}/comments:
 *   put:
 *     summary: Toggle comments on a wiki page
 *     tags: [Wiki]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The page ID or title
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentsEnabled
 *             properties:
 *               commentsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Comments toggled successfully
 *       403:
 *         description: Forbidden - requires protect_pages permission
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.put('/:id/comments', requireAuth, requirePermission('protect_pages'), async (req, res) => {
  try {
    const { id } = req.params;
    const { commentsEnabled } = req.body;

    if (commentsEnabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'commentsEnabled status required'
      });
    }

    const db = req.db;

    // Check that the page exists
    let page = await db.wikiPages.findWikiPageById(id);
    if (!page) {
      page = await db.wikiPages.findWikiPageByTitle(id);
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Update comments_enabled status
    await db.db.run(
      'UPDATE wiki_pages SET comments_enabled = ? WHERE id = ?',
      [commentsEnabled, page.id]
    );

    // Activity log
    await db.activities.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: commentsEnabled ? 'Comments enabled' : 'Comments disabled',
      description: `${commentsEnabled ? 'Enabled' : 'Disabled'} comments on page "${page.title}"`,
      icon: commentsEnabled ? 'message-circle' : 'message-circle-off',
      metadata: { pageTitle: page.title, pageId: page.id }
    });

    res.json({
      success: true,
      message: `Comments ${commentsEnabled ? 'enabled' : 'disabled'} successfully`,
      commentsEnabled
    });

  } catch (error) {
    console.error('Error toggling comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling comments'
    });
  }
});

module.exports = router;
