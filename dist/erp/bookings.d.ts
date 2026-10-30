import { Router } from 'express';
interface Service {
    name: string;
    minutes: number;
    modes: string[];
    description?: string;
}
export interface BookingSettings {
    enabled: boolean;
    services: Service[];
    hours: Record<string, Array<{
        from: string;
        to: string;
    }>>;
    slotMinutes: number;
    bufferMinutes: number;
    noticeHours: number;
    daysAhead: number;
    perSlot: number;
    location: string;
    videoNote: string;
    consultantUserIds: number[];
    closedDates: string[];
    intro: string;
}
export declare function bookingSettings(brand: string): Promise<BookingSettings>;
export declare function freeSlots(brand: string, date: string, serviceName: string): Promise<{
    slots: string[];
    closed?: string;
}>;
export declare function bookingReminders(): Promise<number>;
export declare function bookingsPublicRouter(): Router;
export declare function bookingsRouter(): Router;
export {};
//# sourceMappingURL=bookings.d.ts.map