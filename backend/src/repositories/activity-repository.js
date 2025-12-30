const BaseRepository = require('./base-repository');

class ActivityRepository extends BaseRepository {
    /**
     * Create a new activity log
     * @param {Object} activityData 
     * @param {number} activityData.userId
     * @param {string} activityData.type
     * @param {string} activityData.title
     * @param {string} [activityData.description]
     * @param {string} [activityData.icon]
     * @param {Object} [activityData.metadata]
     * @returns {Promise<number>} Activity ID
     */
    async createActivity(activityData) {
        const { userId, type, title, description, icon, metadata } = activityData;
        const result = await this.db.run(
            'INSERT INTO activities (user_id, type, title, description, icon, metadata) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, title, description, icon, JSON.stringify(metadata || {})]
        );

        return result.lastID;
    }

    /**
     * Get activities for a specific user
     * @param {number} userId 
     * @param {number} [limit=50] 
     * @param {number} [offset=0] 
     * @returns {Promise<Array<Object>>}
     */
    async getActivitiesByUser(userId, limit = 50, offset = 0) {
        return await this.db.all(
            'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );
    }

    /**
     * Get today's activities for a user
     * @param {number} userId 
     * @returns {Promise<Array<Object>>}
     */
    async getTodayActivitiesByUser(userId) {
        return await this.db.all(
            'SELECT * FROM activities WHERE user_id = ? AND DATE(created_at) = DATE("now") ORDER BY created_at DESC',
            [userId]
        );
    }

    /**
     * Search activities for a user
     * @param {number} userId 
     * @param {string} searchTerm 
     * @param {number} [limit=50] 
     * @returns {Promise<Array<Object>>}
     */
    async searchActivities(userId, searchTerm, limit = 50) {
        const term = `%${searchTerm}%`;
        return await this.db.all(
            'SELECT * FROM activities WHERE user_id = ? AND (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC LIMIT ?',
            [userId, term, term, limit]
        );
    }

    /**
     * Get all activities (admin)
     * @param {number} [limit=100] 
     * @param {number} [offset=0] 
     * @returns {Promise<Array<Object>>}
     */
    async getAllActivities(limit = 100, offset = 0) {
        return await this.db.all(`
      SELECT a.*, u.username 
      FROM activities a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    }
}

module.exports = ActivityRepository;
