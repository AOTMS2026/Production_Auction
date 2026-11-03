import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export const initSocket = (httpServer: HttpServer, allowedOrigins: string[]): Server => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    // Client joins specific auction room
    socket.on('join_auction', (auctionId: string) => {
      if (auctionId) {
        socket.join(`auction:${auctionId}`);
      }
    });

    socket.on('leave_auction', (auctionId: string) => {
      if (auctionId) {
        socket.leave(`auction:${auctionId}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return ioInstance;
};

export const getIO = (): Server | null => {
  return ioInstance;
};

export const emitToAuction = (auctionId: string, event: string, payload: any): void => {
  if (ioInstance) {
    ioInstance.to(`auction:${auctionId}`).emit(event, payload);
    // Also emit generic auction:state event if payload is full state
    if (event !== 'auction:state' && payload?.state) {
      ioInstance.to(`auction:${auctionId}`).emit('auction:state', payload.state);
    }
  }
};
