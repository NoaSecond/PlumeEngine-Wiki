const BaseRepository = require('./base-repository');

class TagRepository extends BaseRepository {
    /**
     * Get all tags
     * @returns {Promise<Array<Object>>}
     */
    async getAllTags() {
        return await this.db.all(`
      SELECT * FROM tags 
      ORDER BY name ASC
    `);
    }

    /**
     * Create a new tag
     * @param {string} name 
     * @param {string} color 
     * @returns {Promise<number>} Tag ID
     */
    async createTag(name, color) {
        const result = await this.db.run(
            'INSERT INTO tags (name, color) VALUES (?, ?)',
            [name, color]
        );
        return result.lastID;
    }

    /**
     * Update a tag
     * @param {number} id 
     * @param {string} name 
     * @param {string} color 
     * @returns {Promise<Object>} Updated tag
     */
    async updateTag(id, name, color) {
        await this.db.run(
            'UPDATE tags SET name = ?, color = ? WHERE id = ?',
            [name, color, id]
        );
        return await this.db.get('SELECT * FROM tags WHERE id = ?', [id]);
    }

    /**
     * Delete a tag
     * @param {number} id 
     */
    async deleteTag(id) {
        await this.db.run('DELETE FROM tags WHERE id = ?', [id]);
    }

    /**
     * Get tag by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    async getTagById(id) {
        return await this.db.get('SELECT * FROM tags WHERE id = ?', [id]);
    }

    /**
     * Get permission names for a user based on their tags
     * @param {number} userId 
     * @returns {Promise<Array<Object>>} List of permission names
     */
    async getUserPermissions(userId) {
        return await this.db.all(`
      SELECT DISTINCT p.name
      FROM permissions p
      JOIN tag_permissions tp ON p.id = tp.permission_id
      JOIN tags t ON tp.tag_id = t.id
      JOIN users u ON u.tags LIKE '%' || t.name || '%'
      WHERE u.id = ?
    `, [userId]);
    }

    /**
     * Get permissions for guest users
     * @returns {Promise<Array<Object>>} List of permission names
     */
    async getGuestPermissions() {
        return await this.db.all(`
      SELECT DISTINCT p.name
      FROM permissions p
      JOIN tag_permissions tp ON p.id = tp.permission_id
      JOIN tags t ON tp.tag_id = t.id
      WHERE t.name = 'Utilisateur non connecté'
    `);
    }

    /**
     * Get all tags with their permissions
     * @returns {Promise<Array<Object>>}
     */
    async getAllTagsWithPermissions() {
        const tagPermissions = await this.db.all(`
            SELECT 
                t.id as tag_id,
                t.name as tag_name,
                t.color as tag_color,
                p.id as permission_id,
                p.name as permission_name,
                p.description as permission_description,
                p.category as permission_category
            FROM tags t
            LEFT JOIN tag_permissions tp ON t.id = tp.tag_id
            LEFT JOIN permissions p ON tp.permission_id = p.id
            ORDER BY t.name, p.category, p.name
        `);

        // Helper to format result if needed, but repository can return raw rows or formatted. 
        // For consistency with other repos, let's keep it simple here and let service/route handle complex formatting 
        // OR format it here for the route. The route expects a nested structure.
        // Let's return the nested structure directly from here to keep route clean.

        const tagPermissionsMap = {};
        tagPermissions.forEach(row => {
            if (!tagPermissionsMap[row.tag_id]) {
                tagPermissionsMap[row.tag_id] = {
                    id: row.tag_id,
                    name: row.tag_name,
                    color: row.tag_color,
                    permissions: []
                };
            }

            if (row.permission_id) {
                tagPermissionsMap[row.tag_id].permissions.push({
                    id: row.permission_id,
                    name: row.permission_name,
                    description: row.permission_description,
                    category: row.permission_category
                });
            }
        });

        return Object.values(tagPermissionsMap);
    }

    /**
     * Update permissions for a tag
     * @param {number} tagId 
     * @param {Array<number>} permissionIds 
     */
    async updateTagPermissions(tagId, permissionIds) {
        // This should transactionally update permissions
        // SQLite doesn't have nested transaction support widely used here but we can serialize calls.

        await this.db.run('DELETE FROM tag_permissions WHERE tag_id = ?', [tagId]);

        for (const permissionId of permissionIds) {
            await this.db.run(
                'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
                [tagId, permissionId]
            );
        }
    }
}

module.exports = TagRepository;
