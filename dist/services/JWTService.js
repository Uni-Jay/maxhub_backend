"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET || 'access-secret-key';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
        this.accessTokenExpiry = process.env.JWT_EXPIRY || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    }
    generateAccessToken(user) {
        const payload = {
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions,
        };
        return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry,
            algorithm: 'HS256',
        });
    }
    generateRefreshToken(user) {
        const payload = {
            id: user.id,
            uuid: user.uuid,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry,
            algorithm: 'HS256',
        });
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                algorithms: ['HS256'],
            });
        }
        catch (error) {
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshTokenSecret, {
                algorithms: ['HS256'],
            });
        }
        catch (error) {
            return null;
        }
    }
    decode(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    }
    isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp)
                return true;
            return decoded.exp * 1000 < Date.now();
        }
        catch (error) {
            return true;
        }
    }
    getTimeUntilExpiry(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp)
                return 0;
            return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        }
        catch (error) {
            return 0;
        }
    }
}
exports.JWTService = JWTService;
exports.default = new JWTService();
//# sourceMappingURL=JWTService.js.map