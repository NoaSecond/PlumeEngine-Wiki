const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Page comments management
 */

/**
 * @swagger
 * /comments/{pageId}:
 *   get:
 *     summary: Get comments for a wiki page
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The page ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       username:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Page not found
 *       500:
 *         description: Server error
 */
router.get('/:pageId', async (req, res) => {
    try {
        const pageId = parseInt(req.params.pageId, 10);
        const db = req.db;

        // Check if page exists
        const page = await db.wikiPages.findWikiPageById(pageId);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        // TODO: check page read permissions if private pages implemented

        const comments = await db.comments.getCommentsByPageId(pageId);

        // Transform for frontend if needed (e.g. nested structure)
        // For now, return flat list, frontend can nest them

        res.json({
            success: true,
            comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create a comment
/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pageId
 *               - content
 *             properties:
 *               pageId:
 *                 type: integer
 *               content:
 *                 type: string
 *               parentId:
 *                 type: integer
 *                 description: ID of parent comment if this is a reply
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     content:
 *                       type: string
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { pageId, content, parentId } = req.body;

        if (!pageId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Page ID and content are required'
            });
        }

        const db = req.db;
        // Check if page exists
        const page = await db.wikiPages.findWikiPageById(pageId);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        const commentId = await db.comments.createComment({
            pageId,
            userId: req.user.userId,
            content,
            parentId
        });

        const newComment = await db.comments.getCommentById(commentId);

        // Activity log
        await db.activities.createActivity({
            userId: req.user.userId,
            type: 'comment',
            title: 'Comment added',
            description: `Commented on page "${page.title}"`,
            icon: 'message-square',
            metadata: { pageId, pageTitle: page.title, commentId }
        });

        res.status(201).json({
            success: true,
            comment: newComment
        });

    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update a comment
/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update an existing comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { content } = req.body;
        const db = req.db;

        const comment = await db.comments.getCommentById(id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check ownership
        if (comment.user_id !== req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to edit this comment'
            });
        }

        await db.comments.updateComment(id, content);
        const updatedComment = await db.comments.getCommentById(id);

        res.json({
            success: true,
            comment: updatedComment
        });

    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete a comment
/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const db = req.db;

        const comment = await db.comments.getCommentById(id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check permissions (owner or admin or has delete_comments permission?)
        // Let's check for 'delete_comments' permission or admin owner
        // For simplicity: Owner or Admin

        if (comment.user_id !== req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment'
            });
        }

        await db.comments.deleteComment(id);

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
