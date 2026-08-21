import app from './app.js';
import http from 'http';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocket } from './sockets/index.js';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const startServer = async () => {
  await connectDB();
  
  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

startServer();
