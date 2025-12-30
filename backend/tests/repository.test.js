const request = require('supertest');
const { app, dbManager } = require('../src/server');

describe('Repository Tests', () => {

    beforeAll(async () => {
        console.log('Test setup starting...');
        try {
            await dbManager.connect();
            console.log('DB Connected');
            await dbManager.initializeTables();
            console.log('Tables initialized');
        } catch (e) {
            console.log('Connection error ignored', e);
        }
    });

    describe('UserRepository', () => {
        const uniqueSuffix = Date.now();
        const username = `repo_user_${uniqueSuffix}`;
        const email = `repo_${uniqueSuffix}@test.com`;
        let userId;

        it('should create a new user', async () => {
            console.log('Testing create user');
            const id = await dbManager.users.createUser({
                username,
                email,
                password: 'password123'
            });
            expect(id).toBeDefined();
            console.log('User created, id:', id);
            userId = id;

            const user = await dbManager.users.getUserById(id);
            expect(user.username).toBe(username);
            expect(user.email).toBe(email);
        });

        it('should find user by email', async () => {
            const user = await dbManager.users.findUserByEmail(email);
            expect(user).toBeDefined();
            expect(user.id).toBe(userId);
        });

        it('should update user login time', async () => {
            await dbManager.users.updateLastLogin(userId);
            const user = await dbManager.users.findUserById(userId);
            expect(user.last_login).toBeDefined();
        });
    });

    describe('TagRepository', () => {
        const uniqueSuffix = Date.now();
        const tagName = `TestTag_${uniqueSuffix}`;
        let tagId;

        it('should create a new tag', async () => {
            // createTag returns the ID, not the object
            const id = await dbManager.tags.createTag(tagName, '#FF0000');
            expect(id).toBeDefined();
            tagId = id;

            // Verify creation
            const tag = await dbManager.tags.getTagById(id);
            expect(tag).toBeDefined();
            expect(tag.name).toBe(tagName);
        });

        it('should get all tags', async () => {
            const tags = await dbManager.tags.getAllTags();
            expect(Array.isArray(tags)).toBe(true);
            const found = tags.find(t => t.id === tagId);
            expect(found).toBeDefined();
        });

        it('should update a tag', async () => {
            // updateTag expects (id, name, color)
            await dbManager.tags.updateTag(tagId, tagName, '#00FF00');

            const tag = await dbManager.tags.getTagById(tagId);
            expect(tag.color).toBe('#00FF00');
        });
    });

    describe('WikiPageRepository', () => {
        const uniqueSuffix = Date.now();
        let pageId;
        let userId; // Need a user for history

        beforeAll(async () => {
            // Create a dummy user for page operations
            const u = await dbManager.users.createUser(`wiki_repo_${uniqueSuffix}`, `wiki_${uniqueSuffix}@test.com`, 'pass');
            userId = u.id;
        });

        it('should create a wiki page', async () => {
            const id = await dbManager.wikiPages.createWikiPage({
                title: `Repo Page ${uniqueSuffix}`,
                content: 'Content',
                authorId: userId
            });
            expect(id).toBeDefined();
            pageId = id;

            const page = await dbManager.wikiPages.findWikiPageById(id);
            expect(page).toBeDefined();
            expect(page.title).toContain('Repo Page');
        });

        it('should update a wiki page and create history', async () => {
            // updateWikiPage(id, content, userId)
            await dbManager.wikiPages.updateWikiPage(pageId, 'Updated Content', userId);

            const page = await dbManager.wikiPages.findWikiPageById(pageId);
            expect(page.content).toBe('Updated Content');

            const history = await dbManager.wikiPages.getHistoryForPage(pageId);
            expect(history.length).toBeGreaterThan(0);
        });
    });
});
