import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    static logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    static refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    static forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    static resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
    static sendOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
    static setup2FA(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verify2FA(req: Request, res: Response, next: NextFunction): Promise<void>;
    static disable2FA(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getSessions(req: Request, res: Response, next: NextFunction): Promise<void>;
    static revokeSession(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verify2FALogin(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default AuthController;
//# sourceMappingURL=AuthController.d.ts.map