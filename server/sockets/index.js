import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role, email: decoded.email };
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}${socket.user ? ` (User: ${socket.user.id})` : ''}`);

    socket.on('join:shop', (shopId) => {
      if (shopId) {
        socket.join(`shop:${shopId}`);
      }
    });

    socket.on('leave:shop', (shopId) => {
      if (shopId) {
        socket.leave(`shop:${shopId}`);
      }
    });

    socket.on('join:barber', (barberId) => {
      if (barberId) {
        socket.join(`barber:${barberId}`);
      }
    });

    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitQueueUpdate = (shopId, barberId, payload) => {
  if (!io) return;
  io.to(`shop:${shopId}`).emit('queue:updated', { shopId, barberId, ...payload });
  if (barberId) {
    io.to(`barber:${barberId}`).emit('queue:updated', { shopId, barberId, ...payload });
  }
};

export const emitAppointmentUpdate = (customerId, appointment) => {
  if (!io) return;
  io.to(`user:${customerId}`).emit('appointment:updated', appointment);
};
