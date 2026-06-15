"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidationSchemas = void 0;
exports.authValidationSchemas = {
    login: {
        email: {
            required: true,
            type: 'email',
            message: 'Valid email is required',
        },
        password: {
            required: true,
            type: 'string',
            minLength: 6,
            message: 'Password is required',
        },
        deviceId: {
            required: false,
            type: 'string',
        },
        deviceName: {
            required: false,
            type: 'string',
            maxLength: 255,
        },
        rememberMe: {
            required: false,
            type: 'boolean',
        },
    },
    register: {
        firstName: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 100,
            message: 'First name is required (2-100 characters)',
        },
        lastName: {
            required: true,
            type: 'string',
            minLength: 2,
            maxLength: 100,
            message: 'Last name is required (2-100 characters)',
        },
        email: {
            required: true,
            type: 'email',
            message: 'Valid email is required',
        },
        password: {
            required: true,
            type: 'string',
            minLength: 8,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        },
        phone: {
            required: false,
            type: 'phone',
            maxLength: 20,
        },
        departmentId: {
            required: false,
            type: 'integer',
        },
    },
    logout: {
        sessionId: {
            required: true,
            type: 'uuid',
            message: 'Session ID is required',
        },
    },
    refreshToken: {
        refreshToken: {
            required: true,
            type: 'string',
            message: 'Refresh token is required',
        },
    },
    forgotPassword: {
        email: {
            required: true,
            type: 'email',
            message: 'Valid email is required',
        },
    },
    resetPassword: {
        token: {
            required: true,
            type: 'string',
            message: 'Reset token is required',
        },
        newPassword: {
            required: true,
            type: 'string',
            minLength: 8,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        },
    },
    verifyEmail: {
        otpCode: {
            required: true,
            type: 'string',
            minLength: 4,
            maxLength: 10,
            message: 'OTP code is required',
        },
    },
    sendOTP: {
        email: {
            required: true,
            type: 'email',
            message: 'Valid email is required',
        },
        type: {
            required: true,
            type: 'enum',
            values: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION', '2FA'],
            message: 'Valid OTP type is required',
        },
    },
    setup2FA: {
        method: {
            required: true,
            type: 'enum',
            values: ['TOTP', 'SMS', 'EMAIL'],
            message: 'Valid 2FA method is required',
        },
    },
    verify2FA: {
        otpCode: {
            required: true,
            type: 'string',
            minLength: 4,
            maxLength: 10,
            message: 'OTP code is required',
        },
    },
    disable2FA: {
        password: {
            required: true,
            type: 'string',
            message: 'Password is required to disable 2FA',
        },
    },
    changePassword: {
        currentPassword: {
            required: true,
            type: 'string',
            message: 'Current password is required',
        },
        newPassword: {
            required: true,
            type: 'string',
            minLength: 8,
            message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character',
        },
        confirmPassword: {
            required: true,
            type: 'string',
            message: 'Password confirmation is required',
            match: 'newPassword',
        },
    },
    updateProfile: {
        firstName: {
            required: false,
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        lastName: {
            required: false,
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        phone: {
            required: false,
            type: 'phone',
            maxLength: 20,
        },
        avatar: {
            required: false,
            type: 'url',
        },
    },
    verify2FALogin: {
        sessionId: {
            required: true,
            type: 'uuid',
            message: 'Session ID is required',
        },
        otpCode: {
            required: true,
            type: 'string',
            minLength: 4,
            maxLength: 10,
            message: 'OTP code is required',
        },
    },
};
exports.default = exports.authValidationSchemas;
//# sourceMappingURL=AuthValidationSchemas.js.map