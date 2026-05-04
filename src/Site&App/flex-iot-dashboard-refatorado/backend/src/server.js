import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { authRoutes } from './routes/auth.routes.js';
import { environmentRoutes } from './routes/environment.routes.js';
import { deviceRoutes } from './routes/device.routes.js';
import { dataRoutes } from './routes/data.routes.js';
import { startMqtt } from './services/mqtt.service.js';
import { startOfflineMonitor } from './services/offline.service.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

app.use(cors());
app.use(express.json());

app.get('/healthz', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api', dataRoutes);

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Socket.IO conectado' });
});

const port = Number(process.env.PORT || 3333);
server.listen(port, async () => {
  console.log(`Backend rodando em http://localhost:${port}`);
  await startMqtt(io);
  startOfflineMonitor(io);
});
