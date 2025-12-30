const BaseRepository = require('./base-repository');

class WikiPageRepository extends BaseRepository {
    /**
     * Create a new wiki page
     * @param {Object} pageData 
     * @param {string} pageData.title
     * @param {string} pageData.content
     * @param {number} pageData.authorId
     * @param {boolean} [pageData.isProtected=false]
     * @returns {Promise<number>} Page ID
     */
    async createWikiPage(pageData) {
        const { title, content, authorId, isProtected = false, icon } = pageData;
        const result = await this.db.run(
            'INSERT INTO wiki_pages (title, content, author_id, is_protected, icon) VALUES (?, ?, ?, ?, ?)',
            [title, content, authorId, isProtected, icon]
        );

        return result.lastID;
    }

    /**
     * Find page by title
     * @param {string} title 
     * @returns {Promise<Object|null>}
     */
    async findWikiPageByTitle(title) {
        return await this.db.get('SELECT * FROM wiki_pages WHERE title = ?', [title]);
    }

    /**
     * Get all wiki pages
     * @returns {Promise<Array<Object>>}
     */
    async getAllWikiPages() {
        return await this.db.all(`
      SELECT w.*, u.username as author_username 
      FROM wiki_pages w 
      LEFT JOIN users u ON w.author_id = u.id 
      ORDER BY w.updated_at DESC
    `);
    }

    /**
     * Update wiki page content
     * @param {number|string} id 
     * @param {string} content 
     * @param {number} userId - ID of user making the change (for history)
     */
    async updateWikiPage(id, { content, icon }, userId) {
        // Archive current version before updating
        const currentPage = await this.db.get('SELECT * FROM wiki_pages WHERE id = ?', [id]);

        if (currentPage) {
            await this.db.run(
                'INSERT INTO wiki_page_history (page_id, content, title, changed_by) VALUES (?, ?, ?, ?)',
                [id, currentPage.content, currentPage.title, userId]
            );
        }

        let query = 'UPDATE wiki_pages SET updated_at = CURRENT_TIMESTAMP';
        const params = [];

        if (content !== undefined) {
            query += ', content = ?';
            params.push(content);
        }

        if (icon !== undefined) {
            query += ', icon = ?';
            params.push(icon);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await this.db.run(query, params);
    }


    /**
     * Get history for a page
     * @param {number|string} pageId 
     * @returns {Promise<Array<Object>>}
     */
    async getHistoryForPage(pageId) {
        return await this.db.all(`
            SELECT h.id, h.changed_at, h.title, u.username as changed_by_username
            FROM wiki_page_history h
            LEFT JOIN users u ON h.changed_by = u.id
            WHERE h.page_id = ?
            ORDER BY h.changed_at DESC, h.id DESC
        `, [pageId]);
    }

    /**
     * Get details of a specific history entry
     * @param {number|string} historyId 
     * @returns {Promise<Object|null>}
     */
    async getHistoryDetail(historyId) {
        return await this.db.get(`
            SELECT h.*, u.username as changed_by_username
            FROM wiki_page_history h
            LEFT JOIN users u ON h.changed_by = u.id
            WHERE h.id = ?
        `, [historyId]);
    }

    /**
     * Rename a wiki page
     * @param {number|string} id 
     * @param {string} newTitle 
     */
    async renameWikiPage(id, newTitle) {
        await this.db.run(
            'UPDATE wiki_pages SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newTitle, id]
        );
    }

    /**
     * Find page by ID
     * @param {number|string} id 
     * @returns {Promise<Object|null>}
     */
    async findWikiPageById(id) {
        return await this.db.get(`
      SELECT w.*, u.username as author_username 
      FROM wiki_pages w 
      LEFT JOIN users u ON w.author_id = u.id 
      WHERE w.id = ?
    `, [id]);
    }

    /**
     * Update page protection status
     * @param {number|string} id 
     * @param {boolean} isProtected 
     */
    async updateWikiPageProtection(id, isProtected) {
        await this.db.run(
            'UPDATE wiki_pages SET is_protected = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [isProtected, id]
        );
    }

    /**
     * Delete a wiki page
     * @param {number|string} id 
     */
    async deleteWikiPage(id) {
        await this.db.run('DELETE FROM wiki_pages WHERE id = ?', [id]);
    }
}

module.exports = WikiPageRepository;
