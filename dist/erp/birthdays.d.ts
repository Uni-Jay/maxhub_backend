import { Router } from 'express';
export declare function runBirthdays(force?: boolean): Promise<{
    staff: number;
    clients: number;
}>;
export declare function upcomingBirthdays(days?: number): Promise<any[]>;
export declare function birthdaysRouter(): Router;
//# sourceMappingURL=birthdays.d.ts.map