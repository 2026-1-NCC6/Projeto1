import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requireRole } from '../middleware/auth.js';
import { subscribeTopic } from '../services/mqtt.service.js';

export const deviceRoutes = Router();

deviceRoutes.get('/', auth(), async (req, res) => {
  const items = await prisma.device.findMany({ include: { environment: true }, orderBy: { id: 'desc' } });
  res.json(items);
});

deviceRoutes.post('/', auth(), requireRole('ADMIN', 'TECNICO'), async (req, res) => {
  const item = await prisma.device.create({ data: req.body });
  subscribeTopic(item.mqttTopic);
  res.status(201).json(item);
});

deviceRoutes.put('/:id', auth(), requireRole('ADMIN', 'TECNICO'), async (req, res) => {
  const item = await prisma.device.update({ where: { id: Number(req.params.id) }, data: req.body });
  subscribeTopic(item.mqttTopic);
  res.json(item);
});

deviceRoutes.delete('/:id', auth(), requireRole('ADMIN'), async (req, res) => {
  await prisma.device.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
