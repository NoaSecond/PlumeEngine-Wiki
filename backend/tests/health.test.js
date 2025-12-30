
const request = require('supertest');
const { app, dbManager } = require('../src/server');

describe('Health Check', () => {
    beforeAll(async () => {
        // For tests, we might want to connect to a different DB or just ensure it's connected
        // But since server.js doesn't connect dbManager globally unless startServer is called,
        // we need to connect it here.
        await dbManager.connect();
        // We can skip initializeTables for a simple health check, or run it to be safe
        // await dbManager.initializeTables(); 
    });

    afterAll(async () => {
        await dbManager.close();
    });

    it('should return 200 OK', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
    });
});
