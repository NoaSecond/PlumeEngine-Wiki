const BaseRepository = require('./base-repository');
const bcrypt = require('bcryptjs');

class UserRepository extends BaseRepository {
    /**
     * Create a new user
     * @param {Object} userData
     * @param {string} userData.username
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {boolean} [userData.isAdmin=false]
     * @param {string} [userData.avatar]
     * @param {string} [userData.tags]
     * @returns {Promise<number>} The new user ID
     */
    async createUser(userData) {
        const { username, email, password, isAdmin = false, avatar = '/avatars/avatar-openbookwiki.svg', tags = '' } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await this.db.run(
            'INSERT INTO users (username, email, password_hash, is_admin, avatar, tags) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, isAdmin, avatar, tags]
        );

        return result.lastID;
    }

    /**
     * Find user by username
     * @param {string} username 
     * @returns {Promise<Object|null>}
     */
    async findUserByUsername(username) {
        return await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    }

    /**
     * Find user by email
     * @param {string} email 
     * @returns {Promise<Object|null>}
     */
    async findUserByEmail(email) {
        return await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    /**
     * Find user by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    async findUserById(id) {
        return await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    /**
     * Update user last login time
     * @param {number} userId 
     */
    async updateLastLogin(userId) {
        await this.db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
    }

    /**
     * Get all users
     * @returns {Promise<Array<Object>>}
     */
    async getAllUsers() {
        return await this.db.all(`
      SELECT id, username, email, is_admin, avatar, bio, tags, created_at, last_login 
      FROM users 
      ORDER BY created_at DESC
    `);
    }

    /**
     * Get user profile by ID
     * @param {number} userId 
     * @returns {Promise<Object|null>}
     */
    async getUserById(userId) {
        return await this.db.get(`
      SELECT id, username, email, is_admin, avatar, bio, tags, created_at, last_login 
      FROM users 
      WHERE id = ?
    `, [userId]);
    }

    /**
     * Update user profile
     * @param {number} userId 
     * @param {Object} updates 
     * @returns {Promise<Object|null>} Updated user
     */
    async updateUserProfile(userId, updates) {
        const allowedFields = ['username', 'email', 'avatar', 'bio', 'tags'];
        const fields = [];
        const values = [];

        // Construire la requête dynamiquement avec uniquement les champs autorisés
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        });

        if (fields.length === 0) {
            throw new Error('Aucun champ valide à mettre à jour');
        }

        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

        await this.db.run(query, values);
        return await this.findUserById(userId);
    }
}

module.exports = UserRepository;
