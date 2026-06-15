import { AuthenticatedUser } from '@types/express';
export interface JWTPayload {
    id: number;
    uuid: string;
    email: string;
    roles: string[];
    permissions: string[];
    iat: number;
    exp: number;
}
export declare class JWTService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    constructor();
    generateAccessToken(user: AuthenticatedUser): string;
    generateRefreshToken(user: AuthenticatedUser): string;
    verifyAccessToken(token: string): JWTPayload | null;
    verifyRefreshToken(token: string): JWTPayload | null;
    decode(token: string): JWTPayload | null;
    isTokenExpired(token: string): boolean;
    getTimeUntilExpiry(token: string): number;
}
declare const _default: JWTService;
export default _default;
//# sourceMappingURL=JWTService.d.ts.map