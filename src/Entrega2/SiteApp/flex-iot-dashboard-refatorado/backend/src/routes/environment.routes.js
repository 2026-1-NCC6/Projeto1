import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requireRole } from '../middleware/auth.js';

export const environmentRoutes = Router();

environmentRoutes.get('/', auth(), async (req, res) => {
  const items = await prisma.environment.findMany({ include: { devices: true }, orderBy: { id: 'desc' } });
  res.json(items);
});

environmentRoutes.post('/', auth(), requireRole('ADMIN', 'TECNICO'), async (req, res) => {
  const item = await prisma.environment.create({ data: req.body });
  res.status(201).json(item);
});

environmentRoutes.put('/:id', auth(), requireRole('ADMIN', 'TECNICO'), async (req, res) => {
  const item = await prisma.environment.update({ where: { id: Number(req.params.id) }, data: req.body });
  res.json(item);
});

environmentRoutes.delete('/:id', auth(), requireRole('ADMIN'), async (req, res) => {
  await prisma.environment.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
