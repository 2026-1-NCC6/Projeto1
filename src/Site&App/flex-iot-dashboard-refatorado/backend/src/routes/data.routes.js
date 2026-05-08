import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';
import { getMqttStatus, saveMqttConfig } from '../services/mqtt.service.js';

export const dataRoutes = Router();

dataRoutes.post('/test-reading', async (req, res) => {
  try {
    const topic = req.body.topic || 'flex/sala_museu_1/sensor_01';

    const device = await prisma.device.findUnique({
      where: {
        mqttTopic: topic
      },
      include: {
        environment: true
      }
    });

    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado para este tópico MQTT.',
        topic
      });
    }

    const payload = {
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      pressure: req.body.pressure,
      gas: req.body.gas,
      fogo: req.body.fogo,
      estado: req.body.estado
    };

    const status =
      payload.fogo || payload.estado === 'EMERGENCIA'
        ? 'EMERGENCIA'
        : payload.estado === 'ALERTA'
        ? 'ALERTA'
        : 'ONLINE';

    await prisma.device.update({
      where: {
        id: device.id
      },
      data: {
        status,
        lastSeenAt: new Date()
      }
    });

    const reading = await prisma.reading.create({
      data: {
        deviceId: device.id,
        topic,
        temperature:
          payload.temperature !== undefined && payload.temperature !== null
            ? Number(payload.temperature)
            : null,
        humidity:
          payload.humidity !== undefined && payload.humidity !== null
            ? Number(payload.humidity)
            : null,
        pressure:
          payload.pressure !== undefined && payload.pressure !== null
            ? Number(payload.pressure)
            : null,
        gas:
          payload.gas !== undefined && payload.gas !== null
            ? Number(payload.gas)
            : null,
        fogo: Boolean(payload.fogo),
        estado: payload.estado || 'NORMAL',
        rawPayload: JSON.stringify(payload)
      },
      include: {
        device: {
          include: {
            environment: true
          }
        }
      }
    });

    if (payload.fogo || payload.estado === 'EMERGENCIA') {
      await prisma.alert.create({
        data: {
          deviceId: device.id,
          type: 'FOGO',
          message: 'Fogo detectado ou estado de emergência recebido via teste Postman.',
          value: payload.temperature ? Number(payload.temperature) : null
        }
      });
    }

    if (payload.estado === 'ALERTA') {
      await prisma.alert.create({
        data: {
          deviceId: device.id,
          type: 'TEMPERATURA',
          message: 'Estado de alerta recebido via teste Postman.',
          value: payload.temperature ? Number(payload.temperature) : null
        }
      });
    }

    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        source: 'POSTMAN_TEST',
        message: `Leitura de teste recebida no tópico ${topic}`,
        metadata: JSON.stringify(payload)
      }
    });

    const io = req.app.get('io');

    if (io) {
      io.emit('reading:new', reading);
    }

    res.json({
      message: 'Leitura de teste criada com sucesso.',
      reading
    });
  } catch (error) {
    console.error('Erro ao criar leitura de teste:', error);

    res.status(500).json({
      error: 'Erro ao criar leitura de teste'
    });
  }
});


function csvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return `"${String(value).replaceAll('"', '""')}"`;
}
dataRoutes.get('/relatorio-historico.csv', async (req, res) => {
  try {
    const readings = await prisma.reading.findMany({
      take: 1500,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        device: {
          include: {
            environment: true
          }
        }
      }
    });

    const headers = [
      'data',
      'ambiente',
      'dispositivo',
      'topico',
      'temperatura',
      'umidade',
      'pressao',
      'gas',
      'fogo',
      'estado'
    ];

    const rows = readings.map(reading => [
      reading.createdAt
        ? new Date(reading.createdAt).toLocaleString('pt-BR')
        : '',
      reading.device?.environment?.name || '',
      reading.device?.name || '',
      reading.topic || reading.device?.mqttTopic || '',
      reading.temperature ?? '',
      reading.humidity ?? '',
      reading.pressure ?? '',
      reading.gas ?? '',
      reading.fogo ? 'SIM' : 'NÃO',
      reading.estado || ''
    ]);

    const csv = [
      headers.map(csvValue).join(';'),
      ...rows.map(row => row.map(csvValue).join(';'))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="relatorio-historico-ultimos-1500.csv"'
    );

    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Erro ao gerar relatório CSV:', error);

    res.status(500).json({
      error: 'Erro ao gerar relatório CSV'
    });
  }
});

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
