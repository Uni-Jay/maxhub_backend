import { Server as SocketServer, Socket } from 'socket.io';
export declare function registerCallHandlers(io: SocketServer, socket: Socket, userId: number, h: {
    emitToUser: (io: SocketServer, uid: number, ev: string, p: any) => void;
    getUserSockets: (uid: number) => Set<string>;
}): void;
//# sourceMappingURL=calls.d.ts.map