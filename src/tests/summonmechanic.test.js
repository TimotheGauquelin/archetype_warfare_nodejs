import request from 'supertest';
import app from '../index';
import SummonMechanicService from '../services/SummonMechanicService.js';
import { jest } from '@jest/globals';

// Mock des dépendances
jest.mock('../services/SummonMechanicService.js');

describe('GET /summonMechanics', () => {

    beforeEach(() => {
        SummonMechanicService.getSummonMechanics.mockResolvedValue([
            { id: 1, label: 'Tribute' },
            { id: 2, label: 'Special' },
            { id: 3, label: 'Ritual' },
            { id: 4, label: 'Fusion' },
            { id: 5, label: 'Synchro' },
            { id: 6, label: 'XYZ' },
            { id: 7, label: 'Pendulum' },
            { id: 8, label: 'Link' }
        ]);
    });

    test('should return a list of summon mechanic', async () => {
        const response = await request(app).get('/summonMechanics');
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('each summon mechanic should have an id and a label', async () => {
        const response = await request(app).get('/summonMechanics');
        response.body.forEach(summonMechanic => {
            expect(summonMechanic).toHaveProperty('id');
            expect(summonMechanic).toHaveProperty('label');
        });
    });

    test('should contain 8 summon mechanic', async () => {
        const response = await request(app).get('/summonMechanics');
        expect(response.body.length).toBe(8);
        const summonMechanicLabels = response.body.map(summonMechanic => summonMechanic.label);
        expect(summonMechanicLabels).toContain('Tribute');
        expect(summonMechanicLabels).toContain('Special');
        expect(summonMechanicLabels).toContain('Ritual');
        expect(summonMechanicLabels).toContain('Fusion');
        expect(summonMechanicLabels).toContain('Synchro');
        expect(summonMechanicLabels).toContain('XYZ');
        expect(summonMechanicLabels).toContain('Pendulum');
        expect(summonMechanicLabels).toContain('Link');
    });
});

describe('SummonMechanicService', () => {
    let mockNext;

    beforeEach(() => {
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSummonMechanics', () => {
        it('devrait retourner toutes les mécaniques d\'invocation', async () => {
            const mockMechanics = [
                { id: 1, name: 'Normal Summon' },
                { id: 2, name: 'Special Summon' }
            ];

            SummonMechanicService.getSummonMechanics.mockResolvedValue(mockMechanics);

            const result = await SummonMechanicService.getSummonMechanics(mockNext);

            expect(result).toEqual(mockMechanics);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait gérer les erreurs', async () => {
            const mockError = new Error('Database error');
            SummonMechanicService.getSummonMechanics.mockRejectedValue(mockError);

            await SummonMechanicService.getSummonMechanics(mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});
