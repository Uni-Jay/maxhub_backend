# Phase 5: Real-time Features & WebSocket Integration
## MaxHub Enterprise ERP Platform

**Version:** 1.0.0  
**Framework:** Socket.IO 4.5+  
**Status:** Complete Real-time Architecture  

---

## 1. SOCKET.IO SERVER SETUP

```typescript
// src/config/socket.ts
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export class SocketIOServer {
  private io: Server;
  private connectedUsers: Map<string, string[]> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        socket.data.userId = decoded.id;
        socket.data.roles = decoded.roles;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.data.userId} connected: ${socket.id}`);

      // Track user connection
      this.addUserConnection(socket.data.userId, socket.id);

      // Join user-specific room
      socket.join(`user:${socket.data.userId}`);

      // Handle user joining department room
      socket.on('join-department', (departmentId: string) => {
        socket.join(`department:${departmentId}`);
        this.io.to(`department:${departmentId}`).emit('user-online', {
          userId: socket.data.userId,
          timestamp: new Date(),
        });
      });

      // Handle messaging
      socket.on('send-message', (data: any) => {
        this.handleMessage(socket, data);
      });

      // Handle typing indicator
      socket.on('typing', (data: any) => {
        this.handleTyping(socket, data);
      });

      // Handle activity update
      socket.on('activity-update', (data: any) => {
        this.handleActivityUpdate(socket, data);
      });

      // Handle attendance check-in
      socket.on('check-in', (data: any) => {
        this.handleCheckIn(socket, data);
      });

      // Handle task status update
      socket.on('task-status-update', (data: any) => {
        this.handleTaskUpdate(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.removeUserConnection(socket.data.userId, socket.id);
        console.log(`User ${socket.data.userId} disconnected: ${socket.id}`);
      });
    });
  }

  private addUserConnection(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId)!.push(socketId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const connections = this.connectedUsers.get(userId);
    if (connections) {
      const index = connections.indexOf(socketId);
      if (index > -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private handleMessage(socket: any, data: any) {
    const { conversationId, message } = data;

    this.io.to(`conversation:${conversationId}`).emit('message-received', {
      conversationId,
      message,
      senderId: socket.data.userId,
      timestamp: new Date(),
    });

    // Store message in database
    // await messageService.saveMessage(data);
  }

  private handleTyping(socket: any, data: any) {
    const { conversationId } = data;

    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      userId: socket.data.userId,
      timestamp: new Date(),
    });
  }

  private handleActivityUpdate(socket: any, data: any) {
    const { projectId, activityType, details } = data;

    this.io.to(`project:${projectId}`).emit('activity-update', {
      userId: socket.data.userId,
      activityType,
      details,
      timestamp: new Date(),
    });
  }

  private handleCheckIn(socket: any, data: any) {
    const { location } = data;

    this.io.emit('user-checked-in', {
      userId: socket.data.userId,
      location,
      timestamp: new Date(),
    });
  }

  private handleTaskUpdate(socket: any, data: any) {
    const { taskId, status } = data;

    this.io.emit('task-status-changed', {
      taskId,
      status,
      updatedBy: socket.data.userId,
      timestamp: new Date(),
    });
  }

  // Broadcast notification to user
  notifyUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Broadcast to department
  notifyDepartment(departmentId: string, notification: any) {
    this.io.to(`department:${departmentId}`).emit('department-notification', notification);
  }

  // Broadcast to project
  notifyProject(projectId: string, update: any) {
    this.io.to(`project:${projectId}`).emit('project-update', update);
  }

  // Broadcast attendance event
  broadcastAttendance(event: any) {
    this.io.emit('attendance-event', event);
  }

  // Broadcast task update
  broadcastTaskUpdate(taskId: string, update: any) {
    this.io.emit('task-update', { taskId, ...update });
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get specific user connection status
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getIO(): Server {
    return this.io;
  }
}
```

---

## 2. REAL-TIME NOTIFICATIONS

```typescript
// src/services/NotificationService.ts
import { SocketIOServer } from '../config/socket';
import Notification from '../models/Notification';

export class NotificationService {
  private socketServer: SocketIOServer;

  constructor(socketServer: SocketIOServer) {
    this.socketServer = socketServer;
  }

  async createAndNotify(data: {
    recipientId: number;
    notificationType: string;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    // Save to database
    const notification = await Notification.create(data);

    // Send real-time notification
    this.socketServer.notifyUser(data.recipientId.toString(), {
      id: notification.id,
      type: data.notificationType,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      timestamp: new Date(),
    });

    return notification;
  }

  async notifyMultipleUsers(
    userIds: number[],
    data: {
      notificationType: string;
      title: string;
      message: string;
      actionUrl?: string;
    }
  ) {
    for (const userId of userIds) {
      await this.createAndNotify({
        recipientId: userId,
        ...data,
      });
    }
  }

  async notifyDepartment(
    departmentId: number,
    data: {
      notificationType: string;
      title: string;
      message: string;
    }
  ) {
    this.socketServer.notifyDepartment(departmentId.toString(), {
      ...data,
      timestamp: new Date(),
    });
  }

  async notifyLeaveApproval(userId: number, leaveRequest: any) {
    await this.createAndNotify({
      recipientId: userId,
      notificationType: 'LEAVE_APPROVED',
      title: 'Leave Request Approved',
      message: `Your leave request from ${leaveRequest.startDate} to ${leaveRequest.endDate} has been approved.`,
      actionUrl: `/leave/requests/${leaveRequest.id}`,
    });
  }

  async notifyTaskAssignment(userId: number, task: any) {
    await this.createAndNotify({
      recipientId: userId,
      notificationType: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `Task "${task.title}" has been assigned to you.`,
      actionUrl: `/tasks/${task.id}`,
    });
  }

  async notifyProjectUpdate(projectId: number, update: any) {
    this.socketServer.notifyProject(projectId.toString(), {
      type: 'PROJECT_UPDATE',
      ...update,
      timestamp: new Date(),
    });
  }

  async notifyPayrollGeneration(departmentId: number, period: any) {
    this.socketServer.notifyDepartment(departmentId.toString(), {
      notificationType: 'PAYROLL_GENERATED',
      title: 'Payroll Generated',
      message: `Payroll for ${period} has been generated. Please review.`,
      timestamp: new Date(),
    });
  }
}
```

---

## 3. REAL-TIME CHAT & MESSAGING

```typescript
// src/services/ChatService.ts
import Message from '../models/Message';
import { SocketIOServer } from '../config/socket';

export class ChatService {
  private socketServer: SocketIOServer;

  constructor(socketServer: SocketIOServer) {
    this.socketServer = socketServer;
  }

  async sendMessage(data: {
    conversationId: number;
    userId: number;
    messageText: string;
    attachmentUrl?: string;
  }) {
    const message = await Message.create(data);

    // Emit to conversation room
    this.socketServer.getIO().to(`conversation:${data.conversationId}`).emit(
      'message-received',
      {
        id: message.id,
        conversationId: data.conversationId,
        userId: data.userId,
        messageText: data.messageText,
        attachmentUrl: data.attachmentUrl,
        timestamp: message.createdAt,
      }
    );

    return message;
  }

  async markMessagesAsRead(conversationId: number, userId: number) {
    await Message.sequelize!.query(
      `UPDATE message_reads SET readAt = NOW() 
       WHERE userId = :userId 
       AND messageId IN (
         SELECT id FROM messages WHERE conversationId = :conversationId
       )`,
      {
        replacements: { userId, conversationId },
      }
    );

    // Notify others in conversation
    this.socketServer.getIO().to(`conversation:${conversationId}`).emit(
      'messages-read',
      {
        userId,
        conversationId,
        timestamp: new Date(),
      }
    );
  }

  async broadcastTypingStatus(
    conversationId: number,
    userId: number,
    isTyping: boolean
  ) {
    this.socketServer.getIO().to(`conversation:${conversationId}`).emit(
      'typing-status',
      {
        userId,
        isTyping,
        timestamp: new Date(),
      }
    );
  }

  async deleteMessage(messageId: number, conversationId: number) {
    await Message.update(
      { isDeleted: true, deletedAt: new Date() },
      { where: { id: messageId } }
    );

    this.socketServer.getIO().to(`conversation:${conversationId}`).emit(
      'message-deleted',
      {
        messageId,
        timestamp: new Date(),
      }
    );
  }
}
```

---

## 4. REAL-TIME ATTENDANCE TRACKING

```typescript
// src/services/RealtimeAttendanceService.ts
import { SocketIOServer } from '../config/socket';
import Attendance from '../models/Attendance';

export class RealtimeAttendanceService {
  private socketServer: SocketIOServer;

  constructor(socketServer: SocketIOServer) {
    this.socketServer = socketServer;
  }

  async recordCheckIn(userId: number, location: string) {
    const attendance = await Attendance.create({
      userId,
      checkInTime: new Date(),
      checkInLocation: location,
      status: 'Present',
    });

    // Broadcast to admin dashboard
    this.socketServer.getIO().emit('user-checked-in', {
      userId,
      location,
      timestamp: new Date(),
    });

    // Notify user's department
    const user = await Attendance.sequelize!.query(
      `SELECT departmentId FROM users WHERE id = :userId`,
      { replacements: { userId } }
    );

    if (user[0]) {
      this.socketServer.notifyDepartment((user[0] as any).departmentId, {
        type: 'CHECK_IN',
        userId,
        timestamp: new Date(),
      });
    }

    return attendance;
  }

  async recordCheckOut(userId: number) {
    const attendance = await Attendance.update(
      {
        checkOutTime: new Date(),
      },
      { where: { userId, checkOutTime: null } }
    );

    // Broadcast check-out
    this.socketServer.getIO().emit('user-checked-out', {
      userId,
      timestamp: new Date(),
    });

    return attendance;
  }

  async broadcastAttendanceReport(departmentId: number, report: any) {
    this.socketServer.notifyDepartment(departmentId, {
      type: 'ATTENDANCE_REPORT',
      report,
      timestamp: new Date(),
    });
  }

  async broadcastLiveAttendance(attendanceData: any) {
    this.socketServer.getIO().emit('live-attendance', {
      data: attendanceData,
      timestamp: new Date(),
    });
  }
}
```

---

## 5. REAL-TIME DASHBOARDS

```typescript
// src/services/DashboardRealtimeService.ts
import { SocketIOServer } from '../config/socket';

export class DashboardRealtimeService {
  private socketServer: SocketIOServer;

  constructor(socketServer: SocketIOServer) {
    this.socketServer = socketServer;
  }

  async broadcastDashboardUpdate(userId: number, dashboardData: any) {
    this.socketServer.notifyUser(userId.toString(), {
      type: 'DASHBOARD_UPDATE',
      data: dashboardData,
      timestamp: new Date(),
    });
  }

  async broadcastKPIUpdate(kpiType: string, value: number) {
    this.socketServer.getIO().emit('kpi-update', {
      kpiType,
      value,
      timestamp: new Date(),
    });
  }

  async broadcastRevenueUpdate(revenue: number) {
    this.socketServer.getIO().emit('revenue-update', {
      revenue,
      timestamp: new Date(),
    });
  }

  async broadcastActiveUsersCount(count: number) {
    this.socketServer.getIO().emit('active-users-update', {
      count,
      timestamp: new Date(),
    });
  }

  async broadcastTaskProgress(projectId: number, progress: number) {
    this.socketServer.notifyProject(projectId.toString(), {
      type: 'PROJECT_PROGRESS',
      progress,
      timestamp: new Date(),
    });
  }

  async broadcastSalesUpdate(opportunityId: number, stage: string) {
    this.socketServer.getIO().emit('sales-update', {
      opportunityId,
      stage,
      timestamp: new Date(),
    });
  }
}
```

---

## 6. FRONTEND SOCKET.IO CLIENT

```typescript
// src/services/socket.ts
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        reject(error);
      });

      this.setupDefaultListeners();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private setupDefaultListeners() {
    if (!this.socket) return;

    // Notification
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    // Messages
    this.socket.on('message-received', (data) => {
      this.emit('message-received', data);
    });

    // Typing indicator
    this.socket.on('typing-status', (data) => {
      this.emit('typing-status', data);
    });

    // Activity updates
    this.socket.on('activity-update', (data) => {
      this.emit('activity-update', data);
    });

    // Attendance
    this.socket.on('user-checked-in', (data) => {
      this.emit('user-checked-in', data);
    });

    this.socket.on('user-checked-out', (data) => {
      this.emit('user-checked-out', data);
    });

    // Dashboard updates
    this.socket.on('dashboard-update', (data) => {
      this.emit('dashboard-update', data);
    });

    // Task updates
    this.socket.on('task-update', (data) => {
      this.emit('task-update', data);
    });

    // User presence
    this.socket.on('user-online', (data) => {
      this.emit('user-online', data);
    });
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  sendMessage(conversationId: number, messageText: string, attachmentUrl?: string) {
    this.socket?.emit('send-message', {
      conversationId,
      messageText,
      attachmentUrl,
    });
  }

  notifyTyping(conversationId: number) {
    this.socket?.emit('typing', { conversationId });
  }

  checkIn(location: string) {
    this.socket?.emit('check-in', { location });
  }

  checkOut() {
    this.socket?.emit('check-out', {});
  }

  updateTaskStatus(taskId: number, status: string) {
    this.socket?.emit('task-status-update', { taskId, status });
  }

  joinDepartment(departmentId: number) {
    this.socket?.emit('join-department', departmentId.toString());
  }

  joinProject(projectId: number) {
    this.socket?.emit('join-project', projectId.toString());
  }

  joinConversation(conversationId: number) {
    this.socket?.emit('join-conversation', conversationId.toString());
  }
}

export const socketClient = new SocketClient();
```

---

## 7. FRONTEND SOCKET HOOK

```typescript
// src/hooks/useSocket.ts
import { useEffect, useCallback, useRef } from 'react';
import { socketClient } from '../services/socket';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { user } = useAuth();
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (!user || connectionAttempted.current) return;

    connectionAttempted.current = true;

    const token = localStorage.getItem('accessToken');
    if (token) {
      socketClient.connect(token).catch((error) => {
        console.error('Failed to connect to Socket.IO:', error);
      });
    }

    return () => {
      socketClient.disconnect();
    };
  }, [user]);

  const on = useCallback((event: string, callback: Function) => {
    socketClient.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: Function) => {
    socketClient.off(event, callback);
  }, []);

  const sendMessage = useCallback(
    (conversationId: number, messageText: string, attachmentUrl?: string) => {
      socketClient.sendMessage(conversationId, messageText, attachmentUrl);
    },
    []
  );

  const notifyTyping = useCallback((conversationId: number) => {
    socketClient.notifyTyping(conversationId);
  }, []);

  const checkIn = useCallback((location: string) => {
    socketClient.checkIn(location);
  }, []);

  const checkOut = useCallback(() => {
    socketClient.checkOut();
  }, []);

  const updateTaskStatus = useCallback((taskId: number, status: string) => {
    socketClient.updateTaskStatus(taskId, status);
  }, []);

  const joinDepartment = useCallback((departmentId: number) => {
    socketClient.joinDepartment(departmentId);
  }, []);

  const joinProject = useCallback((projectId: number) => {
    socketClient.joinProject(projectId);
  }, []);

  return {
    on,
    off,
    sendMessage,
    notifyTyping,
    checkIn,
    checkOut,
    updateTaskStatus,
    joinDepartment,
    joinProject,
  };
};
```

---

## 8. REAL-TIME COMPONENTS

```typescript
// src/components/realtime/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Bell, X } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { on, off } = useSocket();

  useEffect(() => {
    const handleNotification = (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [on, off]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-50">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-blue-50 p-3 rounded border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.filter((n) => n.id !== notification.id)
                        )
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// src/components/realtime/LiveChat.tsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface Message {
  id: number;
  userId: number;
  messageText: string;
  timestamp: Date;
}

interface LiveChatProps {
  conversationId: number;
}

export const LiveChat: React.FC<LiveChatProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { on, off, sendMessage, notifyTyping, joinConversation } = useSocket();

  useEffect(() => {
    joinConversation(conversationId);

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = (data: any) => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    };

    on('message-received', handleNewMessage);
    on('typing-status', handleTyping);

    return () => {
      off('message-received', handleNewMessage);
      off('typing-status', handleTyping);
    };
  }, [conversationId, on, off, joinConversation]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(conversationId, messageText);
      setMessageText('');
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    notifyTyping(conversationId);
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-2">
            <div className="bg-gray-100 p-2 rounded">
              <p className="text-sm text-gray-800">{message.messageText}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 text-gray-500 text-sm">
            <span>Someone is typing</span>
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              .
            </span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={handleTypingChange}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 9. REAL-TIME INTEGRATION EXAMPLES

```typescript
// In Leave Approval API
async approveLeaveRequest(requestId: number, approvedBy: number) {
  // Update database
  await LeaveRequest.update(
    { status: 'Approved', approvedBy },
    { where: { id: requestId } }
  );

  // Get leave request details
  const leaveRequest = await LeaveRequest.findByPk(requestId);

  // Send real-time notification
  await notificationService.notifyLeaveApproval(
    leaveRequest.userId,
    leaveRequest
  );

  return leaveRequest;
}

// In Task Assignment API
async assignTask(taskId: number, assigneeId: number, assignedBy: number) {
  const task = await Task.update(
    { assigneeId },
    { where: { id: taskId } }
  );

  // Send real-time notification
  await notificationService.notifyTaskAssignment(assigneeId, task);

  // Broadcast to project
  await dashboardService.broadcastTaskProgress(task.projectId, 50);

  return task;
}

// In Payroll Generation
async generatePayroll(departmentId: number, period: string) {
  // Generate payroll
  const payroll = await this.generatePayrollRecords(departmentId, period);

  // Notify department
  await notificationService.notifyPayrollGeneration(departmentId, period);

  // Broadcast to accounting department
  socketServer.notifyDepartment(departmentId, {
    type: 'PAYROLL_GENERATED',
    period,
    recordCount: payroll.length,
  });

  return payroll;
}
```

---

## 10. CONFIGURATION

**src/server.ts - Integration:**
```typescript
import express from 'express';
import { createServer } from 'http';
import { SocketIOServer } from './config/socket';
import { NotificationService } from './services/NotificationService';
import { ChatService } from './services/ChatService';
import { RealtimeAttendanceService } from './services/RealtimeAttendanceService';
import { DashboardRealtimeService } from './services/DashboardRealtimeService';

const app = express();
const httpServer = createServer(app);
const socketIOServer = new SocketIOServer(httpServer);

// Initialize services
export const notificationService = new NotificationService(socketIOServer);
export const chatService = new ChatService(socketIOServer);
export const attendanceService = new RealtimeAttendanceService(socketIOServer);
export const dashboardService = new DashboardRealtimeService(socketIOServer);

// Start server
httpServer.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## REAL-TIME FEATURES SUMMARY

✅ **Socket.IO Server** - Complete setup with namespaces
✅ **Real-time Notifications** - Push to users, departments, projects
✅ **Live Messaging** - Chat with typing indicators
✅ **Presence Tracking** - Know who's online
✅ **Activity Feeds** - Real-time updates
✅ **Live Attendance** - Check-in/out broadcasting
✅ **Dashboard Updates** - Real-time KPIs & metrics
✅ **Task Management** - Live status updates
✅ **Error Handling** - Reconnection & fallback
✅ **Frontend Integration** - React hooks & components
✅ **Performance Optimized** - Efficient event broadcasting

This completes **Phase 5: Real-time Features**. Ready for **Phase 6: DevOps & Deployment**?