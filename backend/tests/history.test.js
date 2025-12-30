
const request = require('supertest');
const { app, dbManager } = require('../src/server');

describe('Wiki Page History', () => {
    let token;
    let pageId;
    const uniqueSuffix = Date.now();
    const username = `history_tester_${uniqueSuffix}`;
    const email = `history_${uniqueSuffix}@test.com`;
    const pageTitle = `History Test Page ${uniqueSuffix}`;

    beforeAll(async () => {
        // Ensure DB is connected
        try {
            await dbManager.connect();
            await dbManager.initializeTables();
        } catch (e) {
            // Ignore if already connected
        }

        // 1. Register user
        await request(app)
            .post('/api/auth/register')
            .send({
                username,
                email,
                password: 'password123'
            });

        // Promote to Admin to ensure permissions
        await dbManager.db.run("UPDATE users SET is_admin = 1, tags = 'Administrator' WHERE username = ?", [username]);

        // 2. Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username, password: 'password123' });

        token = loginRes.body.token;
    });

    afterAll(async () => {
        // Cleanup if needed, or just close DB connection
        // await dbManager.close(); // Don't close if other tests need it or watch mode
    });

    it('should save history when updating a page', async () => {
        // 1. Create Page
        const createRes = await request(app)
            .post('/api/wiki')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: pageTitle,
                content: 'Version 1 Content'
            });

        expect(createRes.status).toBe(201);
        pageId = createRes.body.page.id;

        // 2. Update Page (V2) - Should archive V1
        const updateRes1 = await request(app)
            .put(`/api/wiki/${pageId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                content: 'Version 2 Content'
            });

        expect(updateRes1.status).toBe(200);

        // 3. Update Page (V3) - Should archive V2
        const updateRes2 = await request(app)
            .put(`/api/wiki/${pageId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                content: 'Version 3 Content'
            });

        expect(updateRes2.status).toBe(200);

        // 4. Get History
        const historyRes = await request(app)
            .get(`/api/wiki/${pageId}/history`);

        expect(historyRes.status).toBe(200);
        expect(historyRes.body.history).toHaveLength(2);

        // Check order (DESC)
        const [latest, oldest] = historyRes.body.history;
        // Latest archived should be Version 2 (archived when we created V3)
        // Oldest archived should be Version 1 (archived when we created V2)
        // Wait, content is not returned in list usually, but let's check title/meta

        // 5. Get History Detail (V1)
        const v1Id = oldest.id;
        const detailRes = await request(app)
            .get(`/api/wiki/${pageId}/history/${v1Id}`);

        expect(detailRes.status).toBe(200);
        expect(detailRes.body.version.content).toBe('Version 1 Content');

        // 6. Get History Detail (V2)
        const v2Id = latest.id;
        const detailRes2 = await request(app)
            .get(`/api/wiki/${pageId}/history/${v2Id}`);

        expect(detailRes2.status).toBe(200);
        expect(detailRes2.body.version.content).toBe('Version 2 Content');
    });
});
