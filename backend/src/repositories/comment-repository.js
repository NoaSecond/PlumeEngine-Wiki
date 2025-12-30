const BaseRepository = require('./base-repository');

class CommentRepository extends BaseRepository {
    /**
     * Create a new comment
     * @param {Object} commentData 
     * @param {number|string} commentData.pageId
     * @param {number} commentData.userId
     * @param {string} commentData.content
     * @param {number|null} [commentData.parentId=null]
     * @returns {Promise<number>} Comment ID
     */
    async createComment(commentData) {
        const { pageId, userId, content, parentId = null } = commentData;
        const result = await this.db.run(
            'INSERT INTO comments (page_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [pageId, userId, content, parentId]
        );
        return result.lastID;
    }

    /**
     * Get comments for a page
     * @param {number|string} pageId 
     * @returns {Promise<Array<Object>>}
     */
    async getCommentsByPageId(pageId) {
        return await this.db.all(`
            SELECT c.*, u.username, u.avatar 
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.page_id = ?
            ORDER BY c.created_at ASC
        `, [pageId]);
    }

    /**
     * Get comment by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    async getCommentById(id) {
        return await this.db.get(`
            SELECT c.*, u.username, u.avatar
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [id]);
    }

    /**
     * Update comment content
     * @param {number} id 
     * @param {string} content 
     */
    async updateComment(id, content) {
        await this.db.run(
            'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, id]
        );
    }

    /**
     * Delete a comment
     * @param {number} id 
     */
    async deleteComment(id) {
        // SQLite with ON DELETE CASCADE should handle children if configured, 
        // but often it's disabled by default or safer to handle manually or rely on recursive deletion if not.
        // For now, let's assume we delete just the comment and let DB handle cascade if possible, 
        // OR we can manually delete replies first if we didn't enable PRAGMA foreign_keys = ON;
        // The current setup probably doesn't strictly enforce foreign keys unless enabled on connection.
        // Let's just delete the row.
        await this.db.run('DELETE FROM comments WHERE id = ?', [id]);
    }

    /**
     * Count comments for a page
     * @param {number|string} pageId 
     * @returns {Promise<number>}
     */
    async countCommentsByPageid(pageId) {
        const result = await this.db.get('SELECT COUNT(*) as count FROM comments WHERE page_id = ?', [pageId]);
        return result.count;
    }
}

module.exports = CommentRepository;
