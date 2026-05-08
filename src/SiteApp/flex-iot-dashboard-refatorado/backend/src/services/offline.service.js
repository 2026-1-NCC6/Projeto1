import { prisma } from '../lib/prisma.js';
import { logSystem } from '../utils/logger.js';

export function startOfflineMonitor(io) {
  const seconds = Number(process.env.OFFLINE_AFTER_SECONDS || 30);

  setInterval(async () => {
    const limit = new Date(Date.now() - seconds * 1000);
    const devices = await prisma.device.findMany({
      where: {
        active: true,
        status: { not: 'OFFLINE' },
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: limit } }]
      }
    });

    for (const device of devices) {
      await prisma.device.update({ where: { id: device.id }, data: { status: 'OFFLINE' } });
      await prisma.alert.create({ data: { deviceId: device.id, type: 'OFFLINE', message: `Dispositivo ${device.name} offline` } });
      await logSystem('OFFLINE', `Dispositivo ${device.name} marcado como offline`, 'WARN');
      io.emit('device:offline', { deviceId: device.id, code: device.code });
    }
  }, 10000);
}
