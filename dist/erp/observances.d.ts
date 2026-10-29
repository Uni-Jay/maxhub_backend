export interface Observance {
    date: string;
    name: string;
    kind: 'public-holiday' | 'celebration';
    note?: string;
}
export declare function easterSunday(y: number): string;
export declare function observancesForYear(y: number): Observance[];
export declare function observancesBetween(start: string, end: string): Observance[];
//# sourceMappingURL=observances.d.ts.map