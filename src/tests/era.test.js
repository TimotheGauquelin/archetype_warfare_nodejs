import request from 'supertest';
import app from '../index';
import { jest } from '@jest/globals';
import EraService from '../services/EraService.js';

jest.mock('../services/EraService.js');

describe('GET /eras', () => {

  beforeEach(() => {
    EraService.getEras.mockResolvedValue([
      { id: 1, label: 'DM' },
      { id: 2, label: 'GX' },
      { id: 3, label: '5Ds' },
      { id: 4, label: 'Zexal' },
      { id: 5, label: 'Arc V' },
      { id: 6, label: 'Vrain' },
      { id: 7, label: 'Modern' },
      { id: 8, label: 'Chronicles' }
    ]);
  });

  test("should retrieve a list of era", async () => {
    const response = await request(app).get('/eras');
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('each era should have an id and a label', async () => {
    const response = await request(app).get('/eras');
    response.body.forEach(era => {
      expect(era).toHaveProperty('id');
      expect(era).toHaveProperty('label');
    });
  });

  test('should contain 8 eras', async () => {
    const response = await request(app).get('/eras');
    expect(response.body.length).toBe(8);
    const eraLabels = response.body.map(era => era.label);
    expect(eraLabels).toContain('DM');
    expect(eraLabels).toContain('GX');
    expect(eraLabels).toContain("5Ds");
    expect(eraLabels).toContain("Zexal");
    expect(eraLabels).toContain("Arc V");
    expect(eraLabels).toContain("Vrain");
    expect(eraLabels).toContain("Modern");
    expect(eraLabels).toContain("Chronicles");
  });
});

describe('EraService', () => {
    let mockNext;

    beforeEach(() => {
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getEras', () => {
        it('devrait retourner toutes les ères', async () => {
            const mockEras = [
                { id: 1, name: 'DM' },
                { id: 2, name: 'GX' }
            ];

            EraService.getEras.mockResolvedValue(mockEras);

            const result = await EraService.getEras(mockNext);

            expect(result).toEqual(mockEras);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait gérer les erreurs', async () => {
            const mockError = new Error('Database error');
            EraService.getEras.mockRejectedValue(mockError);

            await EraService.getEras(mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});
