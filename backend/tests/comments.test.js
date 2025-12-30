const request = require('supertest');
const { app, dbManager } = require('../src/server');

describe('Comment API', () => {
    let token;
    let pageId;
    const uniqueSuffix = Date.now();
    const username = `comment_tester_${uniqueSuffix}`;
    const email = `comment_${uniqueSuffix}@test.com`;
    const pageTitle = `Comment Test Page ${uniqueSuffix}`;

    beforeAll(async () => {
        try {
            await dbManager.connect();
            await dbManager.initializeTables();
        } catch (e) {
            // Ignore if already connected
        }

        // Register user
        await request(app)
            .post('/api/auth/register')
            .send({
                username,
                email,
                password: 'password123'
            });

        // Promote to Admin
        await dbManager.db.run("UPDATE users SET is_admin = 1, tags = 'Administrator' WHERE username = ?", [username]);

        // Wait because DB update might be async but run is callback based or promisified?
        // In database.js it's promisified. So await should work.

        // Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username, password: 'password123' });

        token = loginRes.body.token;

        // Create a wiki page
        const createRes = await request(app)
            .post('/api/wiki')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: pageTitle,
                content: 'Page for comments'
            });

        pageId = createRes.body.page.id;
    });

    it('should create a comment', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pageId,
                content: 'This is a test comment'
            });

        expect(res.status).toBe(201);
        expect(res.body.comment.content).toBe('This is a test comment');
        expect(res.body.comment.page_id).toBe(pageId);
    });

    it('should get comments for a page', async () => {
        const res = await request(app)
            .get(`/api/comments/${pageId}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.comments)).toBe(true);
        expect(res.body.comments.length).toBeGreaterThan(0);
        expect(res.body.comments[0].content).toBe('This is a test comment');
    });

    it('should update a comment', async () => {
        // First get the comment ID from previous test or create new one
        // Let's create a new one to be safe/isolated
        const createRes = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pageId,
                content: 'Comment to update'
            });

        const commentId = createRes.body.comment.id;

        const updateRes = await request(app)
            .put(`/api/comments/${commentId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                content: 'Updated content'
            });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.comment.content).toBe('Updated content');
    });

    it('should delete a comment', async () => {
        const createRes = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                pageId,
                content: 'Comment to delete'
            });

        const commentId = createRes.body.comment.id;

        const deleteRes = await request(app)
            .delete(`/api/comments/${commentId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteRes.status).toBe(200);

        // Verify deletion
        const getRes = await request(app).get(`/api/comments/${pageId}`);
        const found = getRes.body.comments.find(c => c.id === commentId);
        expect(found).toBeUndefined();
    });
});
