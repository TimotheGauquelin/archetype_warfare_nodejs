declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                username: string | null;
                roles: string[];
            };
        }
    }
}

export {};
