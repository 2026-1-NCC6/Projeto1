import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';
import { getMqttStatus, saveMqttConfig } from '../services/mqtt.service.js';

export const dataRoutes = Router();

function periodFilter(req) {
  const { from, to, deviceId, environmentId } = req.query;
  const where = {};
  if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) };
  if (deviceId) where.deviceId = Number(deviceId);
  if (environmentId) where.device = { environmentId: Number(environmentId) };
  return where;
}

dataRoutes.get('/dashboard', auth(), async (req, res) => {
  const latest = await prisma.reading.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { device: { include: { environment: true } } }
  });
  const devices = await prisma.device.findMany({ include: { environment: true } });
  const alerts = await prisma.alert.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { device: true } });
  res.json({ latest, devices, alerts, mqtt: getMqttStatus() });
});

dataRoutes.get('/readings', auth(), async (req, res) => {
  const readings = await prisma.reading.findMany({
    where: periodFilter(req),
    take: Number(req.query.limit || 200),
    orderBy: { createdAt: 'desc' },
    include: { device: { include: { environment: true } } }
  });
  res.json(readings);
});

dataRoutes.get('/alerts', auth(), async (req, res) => {
  const alerts = await prisma.alert.findMany({ take: 200, orderBy: { createdAt: 'desc' }, include: { device: true } });
  res.json(alerts);
});

dataRoutes.get('/logs', auth(), async (req, res) => {
  const logs = await prisma.systemLog.findMany({ take: 200, orderBy: { createdAt: 'desc' } });
  res.json(logs);
});

dataRoutes.get('/reports', auth(), async (req, res) => {
  const where = periodFilter(req);
  const [stats, count] = await Promise.all([
    prisma.reading.aggregate({
      where,
      _min: { temperature: true, humidity: true, pressure: true, gas: true },
      _max: { temperature: true, humidity: true, pressure: true, gas: true },
      _avg: { temperature: true, humidity: true, pressure: true, gas: true }
    }),
    prisma.reading.count({ where })
  ]);
  res.json({ count, stats });
});

dataRoutes.get('/export.csv', auth(), async (req, res) => {
  const readings = await prisma.reading.findMany({ where: periodFilter(req), orderBy: { createdAt: 'desc' }, include: { device: true } });
  const rows = ['data,ambiente_dispositivo,topico,temperatura,umidade,pressao,gas,fogo,estado'];
  for (const r of readings) {
    rows.push([r.createdAt.toISOString(), r.device?.name || '', r.topic, r.temperature ?? '', r.humidity ?? '', r.pressure ?? '', r.gas ?? '', r.fogo, r.estado ?? ''].join(','));
  }
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment('leituras.csv');
  res.send(rows.join('\n'));
});

dataRoutes.get('/mqtt/config', auth(), async (req, res) => {
  const config = await prisma.mqttConfig.findUnique({ where: { id: 1 } });
  res.json(config ? { ...config, password: config.password ? '********' : '' } : null);
});

dataRoutes.post('/mqtt/config', auth(), async (req, res) => {
  const body = { ...req.body };
  if (body.password === '********') delete body.password;
  const config = await saveMqttConfig(body, req.app.get('io'));
  res.json({ ...config, password: config.password ? '********' : '' });
});
