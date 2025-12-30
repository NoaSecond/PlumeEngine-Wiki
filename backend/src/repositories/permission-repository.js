const BaseRepository = require('./base-repository');

class PermissionRepository extends BaseRepository {
    /**
     * Get all permissions with usage count
     * @returns {Promise<Array<Object>>}
     */
    async getAllPermissions() {
        return await this.db.all(`
      SELECT p.*, 
        COUNT(tp.tag_id) as tag_count
      FROM permissions p
      LEFT JOIN tag_permissions tp ON p.id = tp.permission_id
      GROUP BY p.id
      ORDER BY p.category, p.name
    `);
    }

    /**
     * Get permission by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    async getPermissionById(id) {
        return await this.db.get('SELECT * FROM permissions WHERE id = ?', [id]);
    }

    /**
     * Get permission by name
     * @param {string} name 
     * @returns {Promise<Object|null>}
     */
    async getPermissionByName(name) {
        return await this.db.get('SELECT * FROM permissions WHERE name = ?', [name]);
    }

    /**
     * Get permission by name excluding a specific ID (for duplicates check)
     * @param {string} name 
     * @param {number} excludeId 
     * @returns {Promise<Object|null>}
     */
    async getPermissionByNameExcludingId(name, excludeId) {
        return await this.db.get('SELECT * FROM permissions WHERE name = ? AND id != ?', [name, excludeId]);
    }

    /**
     * Create a new permission
     * @param {string} name 
     * @param {string} description 
     * @param {string} category 
     * @returns {Promise<number>} Permission ID
     */
    async createPermission(name, description, category) {
        const result = await this.db.run(
            'INSERT INTO permissions (name, description, category) VALUES (?, ?, ?)',
            [name, description, category || 'general']
        );
        return result.lastID;
    }

    /**
     * Update a permission
     * @param {number} id 
     * @param {string} name 
     * @param {string} description 
     * @param {string} category 
     * @returns {Promise<Object>} Updated permission
     */
    async updatePermission(id, name, description, category) {
        await this.db.run(
            'UPDATE permissions SET name = ?, description = ?, category = ? WHERE id = ?',
            [name, description, category, id]
        );
        return await this.getPermissionById(id);
    }

    /**
     * Delete a permission
     * @param {number} id 
     */
    async deletePermission(id) {
        await this.db.run('DELETE FROM permissions WHERE id = ?', [id]);
    }
}

module.exports = PermissionRepository;
