export declare function initPush(): Promise<string | null>;
export declare function saveSubscription(userId: number, sub: any, userAgent?: string): Promise<void>;
export declare function removeSubscription(endpoint: string): Promise<void>;
export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    icon?: string;
}
export declare function pushToUsers(userIds: number[], payload: PushPayload): Promise<void>;
//# sourceMappingURL=push.d.ts.map