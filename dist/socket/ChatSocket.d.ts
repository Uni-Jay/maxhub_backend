import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
declare const onlineUsers: Map<number, Set<string>>;
export declare function initChatSocket(httpServer: HttpServer): SocketServer;
export { onlineUsers };
//# sourceMappingURL=ChatSocket.d.ts.map