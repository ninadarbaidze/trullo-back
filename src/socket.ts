
export let io: any;

export const init =  (httpServer: any) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    return io;
  }
  
export const getIO =  () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }


