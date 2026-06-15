export declare const authValidationSchemas: {
    login: {
        email: {
            required: boolean;
            type: string;
            message: string;
        };
        password: {
            required: boolean;
            type: string;
            minLength: number;
            message: string;
        };
        deviceId: {
            required: boolean;
            type: string;
        };
        deviceName: {
            required: boolean;
            type: string;
            maxLength: number;
        };
        rememberMe: {
            required: boolean;
            type: string;
        };
    };
    register: {
        firstName: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
            message: string;
        };
        lastName: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
            message: string;
        };
        email: {
            required: boolean;
            type: string;
            message: string;
        };
        password: {
            required: boolean;
            type: string;
            minLength: number;
            message: string;
        };
        phone: {
            required: boolean;
            type: string;
            maxLength: number;
        };
        departmentId: {
            required: boolean;
            type: string;
        };
    };
    logout: {
        sessionId: {
            required: boolean;
            type: string;
            message: string;
        };
    };
    refreshToken: {
        refreshToken: {
            required: boolean;
            type: string;
            message: string;
        };
    };
    forgotPassword: {
        email: {
            required: boolean;
            type: string;
            message: string;
        };
    };
    resetPassword: {
        token: {
            required: boolean;
            type: string;
            message: string;
        };
        newPassword: {
            required: boolean;
            type: string;
            minLength: number;
            message: string;
        };
    };
    verifyEmail: {
        otpCode: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
            message: string;
        };
    };
    sendOTP: {
        email: {
            required: boolean;
            type: string;
            message: string;
        };
        type: {
            required: boolean;
            type: string;
            values: string[];
            message: string;
        };
    };
    setup2FA: {
        method: {
            required: boolean;
            type: string;
            values: string[];
            message: string;
        };
    };
    verify2FA: {
        otpCode: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
            message: string;
        };
    };
    disable2FA: {
        password: {
            required: boolean;
            type: string;
            message: string;
        };
    };
    changePassword: {
        currentPassword: {
            required: boolean;
            type: string;
            message: string;
        };
        newPassword: {
            required: boolean;
            type: string;
            minLength: number;
            message: string;
        };
        confirmPassword: {
            required: boolean;
            type: string;
            message: string;
            match: string;
        };
    };
    updateProfile: {
        firstName: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
        };
        lastName: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
        };
        phone: {
            required: boolean;
            type: string;
            maxLength: number;
        };
        avatar: {
            required: boolean;
            type: string;
        };
    };
    verify2FALogin: {
        sessionId: {
            required: boolean;
            type: string;
            message: string;
        };
        otpCode: {
            required: boolean;
            type: string;
            minLength: number;
            maxLength: number;
            message: string;
        };
    };
};
export default authValidationSchemas;
//# sourceMappingURL=AuthValidationSchemas.d.ts.map