import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                username: string;
                roles: string[];
            };
        }
    }
}

export {};
