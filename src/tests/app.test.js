import request from 'supertest';
import app from '../index';

describe('Application Express', () => {
    test('devrait répondre à la route racine', async () => {
        const response = await request(app).get('/api');
        expect(response.status).toBe(200);
    });
});
