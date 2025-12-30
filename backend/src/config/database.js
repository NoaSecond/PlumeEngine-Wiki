const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const logger = require('../utils/logger');

// Repositories
const UserRepository = require('../repositories/user-repository');
const WikiPageRepository = require('../repositories/wiki-page-repository');
const TagRepository = require('../repositories/tag-repository');
const ActivityRepository = require('../repositories/activity-repository');
const PermissionRepository = require('../repositories/permission-repository');
const CommentRepository = require('../repositories/comment-repository');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/openbookwiki.db');
    this.db = null;

    // Repositories initialization
    this.users = null;
    this.wikiPages = null;
    this.tags = null;
    this.activities = null;
    this.permissions = null;
    this.comments = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error connecting to database:', err);
          reject(err);
        } else {
          logger.info('Connected to SQLite database');
          // Sauvegarder la méthode originale
          const originalRun = this.db.run.bind(this.db);

          // Promisify the database methods avec support pour lastID
          this.db.run = function (sql, params = []) {
            return new Promise((resolve, reject) => {
              originalRun(sql, params, function (err) {
                if (err) {
                  reject(err);
                } else {
                  resolve({ lastID: this.lastID, changes: this.changes });
                }
              });
            });
          };

          this.db.get = promisify(this.db.get.bind(this.db));
          this.db.all = promisify(this.db.all.bind(this.db));

          // Initialize repositories
          this.users = new UserRepository(this.db);
          this.wikiPages = new WikiPageRepository(this.db);
          this.tags = new TagRepository(this.db);
          this.activities = new ActivityRepository(this.db);
          this.permissions = new PermissionRepository(this.db);
          this.comments = new CommentRepository(this.db);

          resolve();
        }
      });
    });
  }

  async initializeTables() {
    try {
      // Create users table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          avatar TEXT DEFAULT '/avatars/avatar-openbookwiki.svg',
          bio TEXT DEFAULT '',
          tags TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);

      // Create activities table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create wiki_pages table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS wiki_pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_protected BOOLEAN DEFAULT FALSE,
          comments_enabled BOOLEAN DEFAULT FALSE,
          icon TEXT,
          FOREIGN KEY (author_id) REFERENCES users (id)
        )
      `);

      // Create wiki_page_history table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS wiki_page_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          title TEXT NOT NULL,
          changed_by INTEGER NOT NULL,
          change_reason TEXT,
          changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (page_id) REFERENCES wiki_pages (id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES users (id)
        )
      `);

      // Create comments table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          parent_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (page_id) REFERENCES wiki_pages (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE
        )
      `);

      // Create tags table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          color TEXT NOT NULL DEFAULT '#3B82F6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create permissions table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          category TEXT DEFAULT 'general',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create tag_permissions table (many-to-many relationship)
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS tag_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
          UNIQUE(tag_id, permission_id)
        )
      `);

      // Create indexes
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_wiki_pages_title ON wiki_pages (title)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_wiki_page_history_page_id ON wiki_page_history (page_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_comments_page_id ON comments (page_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions (name)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_tag_permissions_tag_id ON tag_permissions (tag_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_tag_permissions_permission_id ON tag_permissions (permission_id)');

      logger.info('Database tables initialized successfully');

      // Migrate existing tables if needed
      await this.migrateDatabase();

      // Seed default data
      await this.seedDefaultData();

    } catch (error) {
      logger.error('Error initializing database tables:', error);
      throw error;
    }
  }

  async migrateDatabase() {
    try {
      // Check if bio and tags columns exist in users table
      const userTableInfo = await this.db.all("PRAGMA table_info(users)");
      const userColumns = userTableInfo.map(col => col.name);

      if (!userColumns.includes('bio')) {
        await this.db.run('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ""');
        logger.info('Added bio column to users table');
      }

      if (!userColumns.includes('tags')) {
        await this.db.run('ALTER TABLE users ADD COLUMN tags TEXT DEFAULT ""');
        logger.info('Added tags column to users table');
      }

      // Check if comments_enabled column exists in wiki_pages table
      const wikiPagesTableInfo = await this.db.all("PRAGMA table_info(wiki_pages)");
      const wikiPagesColumns = wikiPagesTableInfo.map(col => col.name);

      if (!wikiPagesColumns.includes('comments_enabled')) {
        await this.db.run('ALTER TABLE wiki_pages ADD COLUMN comments_enabled BOOLEAN DEFAULT FALSE');
        logger.info('Added comments_enabled column to wiki_pages table');
      }

      if (!wikiPagesColumns.includes('icon')) {
        await this.db.run('ALTER TABLE wiki_pages ADD COLUMN icon TEXT');
        logger.info('Added icon column to wiki_pages table');
      }
    } catch (error) {
      logger.error('Error during database migration:', error);
      // Continue even if migration fails for non-critical columns
    }
  }

  async seedDefaultData() {
    try {
      // Check if admin user exists
      const adminUser = await this.users.findUserByUsername('admin');

      if (!adminUser) {
        // Create default admin user
        await this.users.createUser({
          username: 'admin',
          email: 'admin@openbookwiki.com',
          password: 'admin123',
          isAdmin: true,
          avatar: '/avatars/avatar-openbookwiki.svg',
          bio: 'Main administrator of Open Book Wiki.',
          tags: 'Administrator'
        });

        const newAdmin = await this.users.findUserByUsername('admin');

        // Create welcome activity for admin
        await this.activities.createActivity({
          userId: newAdmin.id,
          type: 'system',
          title: 'Welcome to Open Book Wiki!',
          description: 'Your admin account has been created successfully.',
          icon: 'shield',
          metadata: {}
        });

        console.log('Default admin user created successfully');
        console.log('Login credentials: admin / admin123');
      }

      // Create test users if they don't exist
      const contributorUser = await this.users.findUserByUsername('contributor');
      if (!contributorUser) {
        await this.users.createUser({
          username: 'contributor',
          email: 'contributor@openbookwiki.com',
          password: 'contrib123',
          isAdmin: false,
          avatar: '/avatars/avatar-blue.svg',
          bio: 'Contributor user who can create and modify articles.',
          tags: 'Contributor'
        });

        console.log('Test contributor user created successfully');
        console.log('Login credentials: contributor / contrib123');
      }

      const visitorUser = await this.users.findUserByUsername('visitor');
      if (!visitorUser) {
        await this.users.createUser({
          username: 'visitor',
          email: 'visitor@openbookwiki.com',
          password: 'visit123',
          isAdmin: false,
          avatar: '/avatars/avatar-green.svg',
          bio: 'Visitor user with read-only access.',
          tags: 'Visitor'
        });

        console.log('Test visitor user created successfully');
        console.log('Login credentials: visitor / visit123');
      }

      // Check if default pages exist
      const pageCount = await this.db.get('SELECT COUNT(*) as count FROM wiki_pages');

      if (pageCount.count === 0) {
        // Create default pages
        const adminUser = await this.users.findUserByUsername('admin');

        const defaultPages = [
          {
            title: 'Home',
            content: `# Welcome to Open Book Wiki!

Your personal wiki is now up and running! 🎉

## What is Open Book Wiki?

Open Book Wiki is a simple and modern collaborative documentation platform. It allows you to easily create, organize, and share your knowledge.

## How to get started?

### 1. 🔐 Authentication
- Click on "Login" in the top right corner
- Use the credentials: **admin** / **admin123**
- Once logged in, you will have access to editing features

### 2. ✏️ Create content
- Click on "Edit" at the top right of this page to edit it
- Use the "+" button in the sidebar to create new pages
- Organize your pages by categories

### 3. 🎨 Customization
- Toggle between dark and light mode with the switch at the top
- Access the admin panel to manage users
- Configure settings according to your needs

## Main Features

- ✏️ **Markdown Editing**: Simple and powerful syntax
- 🔍 **Search**: Quickly find your content
- 👥 **Multi-user**: Team collaboration
- 🔒 **Protected Pages**: Control access to sensitive content
- 📊 **Activity Tracking**: Modification history
- 🌙 **Dark Mode**: Interface tailored to your preferences
- 📱 **Responsive**: Works on all devices

## Markdown Syntax

Here are some examples of Markdown syntax you can use:

\`\`\`markdown
# Level 1 Title
## Level 2 Title
### Level 3 Title

**Bold text**
*Italic text*
\`Inline code\`

- Bullet point list
- Item 2
- Item 3

1. Numbered list
2. Item 2
3. Item 3

[Link to a page](https://example.com)

> Quote
> On multiple lines
\`\`\`

## Support and Resources

- 📖 [Markdown Documentation](https://www.markdownguide.org/)
- 🐛 [Report a bug](https://github.com/NoaSecond/Open-Book-Wiki/issues/new?labels=bug)
- 💡 [Suggest an improvement](https://github.com/NoaSecond/Open-Book-Wiki/issues/new?labels=enhancement)

---

*Happy wiki-ing! 🚀*`,
            authorId: adminUser.id,
            isProtected: false,
            icon: 'home'
          },
          {
            title: 'Getting Started',
            content: `# Quick Start Guide

This guide will help you get started with Open Book Wiki quickly.

## Step 1: Login

1. Click on the "Login" button in the top right
2. Enter your credentials:
   - **Username**: admin
   - **Password**: admin123
3. Click on "Login"

## Step 2: Navigation

### Sidebar
- **Home**: Main wiki page
- **Categories**: Organize your pages by themes
- **+ Button**: Create a new page

### Top Bar
- **Search**: Quickly find a page
- **Dark/Light Mode**: Change appearance
- **User Menu**: Profile and logout

## Step 3: Content Creation

### Create a new page
1. Click the "+" button in the sidebar
2. Give your page a title
3. Write content in Markdown
4. Click "Save"

### Edit an existing page
1. Navigate to the page you want to edit
2. Click "Edit" at the top right
3. Make your changes
4. Save your changes

## Step 4: Organization

### Categories
Organize your pages into logical categories:
- Technical Documentation
- User Guides
- Internal Procedures
- FAQ
- Personal Notes

### Protected Pages
Some pages can be protected from editing by unauthorized users.

## Usage Tips

### Useful Markdown Syntax
- \`# Title\` for main headings
- \`## Subtitle\` for sub-sections
- \`**bold**\` for highlighting
- \`\`code\`\` for inline code
- \`- item\` for lists

### Best Practices
- Use clear and descriptive titles
- Organize content with sub-sections
- Add links between related pages
- Keep your pages updated

---

You are now ready to use Open Book Wiki! 🎉`,
            authorId: adminUser.id,
            isProtected: false
          }
        ];

        for (const page of defaultPages) {
          await this.wikiPages.createWikiPage({
            title: page.title,
            content: page.content,
            authorId: page.authorId,
            isProtected: page.isProtected
          });

          await this.activities.createActivity({
            userId: page.authorId,
            type: 'create',
            title: 'Page "' + page.title + '" created',
            description: 'Creation of default page "' + page.title + '"',
            icon: 'book-open',
            metadata: {}
          });
        }

        logger.info('Default wiki pages created successfully');
      }

      // Create default tags if they don't exist
      const tagCount = await this.db.get('SELECT COUNT(*) as count FROM tags');

      if (tagCount.count === 0) {
        const defaultTags = [
          { name: 'Administrator', color: '#DC2626' }, // Red
          { name: 'Contributor', color: '#2563EB' },   // Blue
          { name: 'Visitor', color: '#6B7280' },       // Gray
          { name: 'Unauthenticated User', color: '#94A3B8' } // Slate
        ];

        for (const tag of defaultTags) {
          await this.tags.createTag(tag.name, tag.color);
        }

        logger.info('Default tags created successfully');
      }

      // Create default permissions if they don't exist
      const permissionCount = await this.db.get('SELECT COUNT(*) as count FROM permissions');

      if (permissionCount.count === 0) {
        const defaultPermissions = [
          // Admin permissions
          { name: 'admin_panel_access', description: 'Access to the administration panel', category: 'admin' },
          { name: 'user_management', description: 'User management', category: 'admin' },
          { name: 'tag_management', description: 'Tag management', category: 'admin' },
          { name: 'permission_management', description: 'Permission management', category: 'admin' },
          { name: 'database_management', description: 'Database management', category: 'admin' },
          { name: 'view_activity_admin', description: 'View activity (admin)', category: 'admin' },

          // Pages
          { name: 'create_pages', description: 'Create pages', category: 'pages' },
          { name: 'edit_pages', description: 'Edit pages', category: 'pages' },
          { name: 'delete_pages', description: 'Delete pages', category: 'pages' },
          { name: 'protect_pages', description: 'Protect/unprotect pages', category: 'pages' },
          { name: 'reorder_pages', description: 'Reorder pages', category: 'pages' },

          // Sections
          { name: 'create_sections', description: 'Create sections', category: 'sections' },
          { name: 'delete_sections', description: 'Delete sections', category: 'sections' },
          { name: 'edit_sections', description: 'Edit sections', category: 'sections' },
          { name: 'reorder_sections', description: 'Reorder sections', category: 'sections' },

          // User permissions
          { name: 'edit_own_profile', description: 'Edit own profile', category: 'user' },
          { name: 'change_avatar', description: 'Change avatar', category: 'user' },
          { name: 'view_activity', description: 'View activity', category: 'user' }
        ];

        for (const permission of defaultPermissions) {
          await this.db.run(
            'INSERT INTO permissions (name, description, category) VALUES (?, ?, ?)',
            [permission.name, permission.description, permission.category]
          );
        }

        logger.info('Default permissions created successfully');
      }

      // Create default tag permissions if they don't exist
      const tagPermissionCount = await this.db.get('SELECT COUNT(*) as count FROM tag_permissions');

      if (tagPermissionCount.count === 0) {
        // Get tag and permission IDs
        const adminTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Administrator']);
        const contributorTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Contributor']);
        const visitorTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Visitor']);

        const allPermissions = await this.db.all('SELECT id, name FROM permissions');
        const permissionMap = {};
        allPermissions.forEach(p => permissionMap[p.name] = p.id);

        // Admin permissions (all permissions)
        if (adminTag) {
          for (const permission of allPermissions) {
            await this.db.run(
              'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
              [adminTag.id, permission.id]
            );
          }
        }

        // Contributor permissions (user permissions + edit pages)
        if (contributorTag) {
          const contributorPermissions = [
            'create_pages', 'edit_pages', 'edit_own_profile', 'change_avatar', 'view_activity'
          ];

          for (const permName of contributorPermissions) {
            if (permissionMap[permName]) {
              await this.db.run(
                'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
                [contributorTag.id, permissionMap[permName]]
              );
            }
          }
        }

        // Visitor permissions (user permissions only)
        if (visitorTag) {
          const visitorPermissions = [
            'edit_own_profile', 'change_avatar', 'view_activity'
          ];

          for (const permName of visitorPermissions) {
            if (permissionMap[permName]) {
              await this.db.run(
                'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
                [visitorTag.id, permissionMap[permName]]
              );
            }
          }
        }

        // Guest permissions (unauthenticated users)
        const guestTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Unauthenticated User']);
        if (guestTag) {
          const guestPermissions = [
            'view_activity'
          ];

          for (const permName of guestPermissions) {
            if (permissionMap[permName]) {
              await this.db.run(
                'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
                [guestTag.id, permissionMap[permName]]
              );
            }
          }
        }

        console.log('Default tag permissions created successfully');
      }
    } catch (error) {
      console.error('Error seeding default data:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database:', err);
          } else {
            logger.info('Database connection closed');
          }
          resolve();
        });
      });
    }
  }
}

module.exports = DatabaseManager;
