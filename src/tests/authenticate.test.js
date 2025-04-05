import { jest } from '@jest/globals';
import AuthenticateController from '../controllers/AuthenticateController.js';
import User from '../models/UserModel.js';
import Role from '../models/RoleModel.js';
import { CustomError } from '../errors/CustomError.js';
import AuthenticateService from '../services/AuthenticateService.js';
import { generateRandomToken } from '../utils/token.js';
import { sendPasswordResetEmail } from '../mailing/sendPasswordResetMail.js';

// Mock des dépendances
jest.mock('../models/UserModel.js');
jest.mock('../models/RoleModel.js');
jest.mock('../services/AuthenticateService.js');
jest.mock('../utils/token.js');
jest.mock('../mailing/sendPasswordResetMail.js');

describe('AuthenticateController', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('devrait retourner une erreur si email et password sont manquants', async () => {
            mockRequest.body = {};
            await AuthenticateController.login(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                password: 'password123'
            };
            User.findOne.mockResolvedValue(null);

            await AuthenticateController.login(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait retourner une erreur si le mot de passe est incorrect', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com',
                password: 'hashedPassword',
                is_active: true,
                Roles: [{ label: 'user' }]
            };

            mockRequest.body = {
                email: 'test@test.com',
                password: 'wrongPassword'
            };
            User.findOne.mockResolvedValue(mockUser);
            User.validPassword.mockResolvedValue(false);

            await AuthenticateController.login(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait retourner une erreur si le compte n\'est pas actif', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com',
                password: 'hashedPassword',
                is_active: false,
                Roles: [{ label: 'user' }]
            };

            mockRequest.body = {
                email: 'test@test.com',
                password: 'password123'
            };
            User.findOne.mockResolvedValue(mockUser);
            User.validPassword.mockResolvedValue(true);

            await AuthenticateController.login(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait réussir la connexion avec des identifiants valides', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com',
                password: 'hashedPassword',
                is_active: true,
                Roles: [{ label: 'user' }]
            };

            mockRequest.body = {
                email: 'test@test.com',
                password: 'password123'
            };
            User.findOne.mockResolvedValue(mockUser);
            User.validPassword.mockResolvedValue(true);
            User.generateToken.mockResolvedValue('mockToken');

            await AuthenticateController.login(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Connexion réussie !",
                token: 'mockToken'
            });
        });
    });

    describe('requestNewPassword', () => {
        it('devrait retourner une erreur si l\'email est manquant', async () => {
            mockRequest.body = {};
            await AuthenticateController.requestNewPassword(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait réussir la demande de réinitialisation de mot de passe', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com'
            };

            mockRequest.body = {
                email: 'test@test.com'
            };
            User.findOne.mockResolvedValue(mockUser);

            await AuthenticateController.requestNewPassword(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Si un compte avec cet email existe, un lien de réinitialisation de mot de passe a été envoyé."
            });
        });
    });

    describe('updatePassword', () => {
        it('devrait retourner une erreur si le mot de passe ou la confirmation sont manquants', async () => {
            mockRequest.params = { userId: '1' };
            mockRequest.body = {};
            await AuthenticateController.updatePassword(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait retourner une erreur si les mots de passe ne correspondent pas', async () => {
            mockRequest.params = { userId: '1' };
            mockRequest.body = {
                password: 'password123',
                confirmationPassword: 'differentPassword'
            };
            await AuthenticateController.updatePassword(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
            mockRequest.params = { userId: '1' };
            mockRequest.body = {
                password: 'password123',
                confirmationPassword: 'password123'
            };
            User.findByPk.mockResolvedValue(null);

            await AuthenticateController.updatePassword(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.any(CustomError)
            );
        });

        it('devrait réussir la mise à jour du mot de passe', async () => {
            const mockUser = {
                id: 1,
                email: 'test@test.com'
            };

            mockRequest.params = { userId: '1' };
            mockRequest.body = {
                password: 'newPassword123',
                confirmationPassword: 'newPassword123'
            };
            User.findByPk.mockResolvedValue(mockUser);

            await AuthenticateController.updatePassword(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Le mot de passe a été mis à jour avec succès."
            });
        });
    });
});