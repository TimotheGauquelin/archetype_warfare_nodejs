import request from 'supertest';
import app from '../index';
import AttributeService from '../services/AttributeService.js';
import { jest } from '@jest/globals';

jest.mock('../services/AttributeService.js');

describe('GET /attributes', () => {

    beforeEach(() => {
        AttributeService.getAttributes.mockResolvedValue([
            { id: 1, label: 'Fire' },
            { id: 2, label: 'Water' },
            { id: 3, label: 'Earth' },
            { id: 4, label: 'Wind' },
            { id: 5, label: 'Dark' },
            { id: 6, label: 'Light' },
        ]);
    });

    test('should retrieve an attributes list', async () => {
        const response = await request(app).get('/attributes');
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('each attribute should have an id and a label', async () => {
        const response = await request(app).get('/attributes');
        response.body.forEach(attribute => {
            expect(attribute).toHaveProperty('id');
            expect(attribute).toHaveProperty('label');
        });
    });

    test('should contain 6 attributes', async () => {
        const response = await request(app).get('/attributes');
        expect(response.body.length).toBe(6);
        const attributeLabels = response.body.map(attribute => attribute.label);
        expect(attributeLabels).toContain('Fire');
        expect(attributeLabels).toContain('Water');
        expect(attributeLabels).toContain('Earth');
        expect(attributeLabels).toContain('Wind');
        expect(attributeLabels).toContain('Dark');
        expect(attributeLabels).toContain('Light');
    });
});

describe('AttributeService', () => {
    let mockNext;

    beforeEach(() => {
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAttributes', () => {
        it('devrait retourner tous les attributs', async () => {
            const mockAttributes = [
                { id: 1, name: 'Light' },
                { id: 2, name: 'Dark' }
            ];

            AttributeService.getAttributes.mockResolvedValue(mockAttributes);

            const result = await AttributeService.getAttributes(mockNext);

            expect(result).toEqual(mockAttributes);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait gérer les erreurs', async () => {
            const mockError = new Error('Database error');
            AttributeService.getAttributes.mockRejectedValue(mockError);

            await AttributeService.getAttributes(mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});
