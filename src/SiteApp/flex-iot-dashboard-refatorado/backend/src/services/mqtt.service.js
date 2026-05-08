import mqtt from 'mqtt';
import { prisma } from '../lib/prisma.js';
import { processReading } from './reading.service.js';
import { logSystem } from '../utils/logger.js';

let client = null;
let connectionStatus = 'disconnected';

export function getMqttStatus() {
  return { status: connectionStatus, connected: connectionStatus === 'connected' };
}

export async function startMqtt(io) {
  const config = await prisma.mqttConfig.findUnique({ where: { id: 1 } });
  if (!config?.host) {
    await logSystem('MQTT', 'Configuração MQTT não encontrada. Salve a configuração pela tela.', 'WARN');
    return;
  }
  await connectMqtt(config, io);
}

export async function saveMqttConfig(data, io) {
  const config = await prisma.mqttConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data }
  });
  await logSystem('MQTT', 'Configuração MQTT atualizada', 'INFO', { host: config.host, port: config.port });
  await connectMqtt(config, io);
  return config;
}

export async function connectMqtt(config, io) {
  if (client) client.end(true);

  const url = `${config.protocol || 'wss'}://${config.host}:${config.port || '8884'}/mqtt`;
  connectionStatus = 'connecting';
  io.emit('mqtt:status', getMqttStatus());

  client = mqtt.connect(url, {
    username: config.username || undefined,
    password: config.password || undefined,
    clientId: `backend_flex_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000
  });

  client.on('connect', async () => {
    connectionStatus = 'connected';
    const devices = await prisma.device.findMany({ where: { active: true } });
    for (const device of devices) client.subscribe(device.mqttTopic);
    await logSystem('MQTT', 'Conectado ao broker e inscrito nos tópicos', 'INFO', { totalTopics: devices.length });
    io.emit('mqtt:status', getMqttStatus());
  });

  client.on('error', async (err) => {
    connectionStatus = 'error';
    await logSystem('MQTT', err.message, 'ERROR');
    io.emit('mqtt:status', getMqttStatus());
  });

  client.on('close', () => {
    connectionStatus = 'disconnected';
    io.emit('mqtt:status', getMqttStatus());
  });

  client.on('message', async (topic, message) => {
    const rawPayload = message.toString();
    try {
      const payload = JSON.parse(rawPayload);
      await processReading({ topic, payload, rawPayload, io });
    } catch (error) {
      await logSystem('MQTT', 'JSON inválido recebido', 'ERROR', { topic, rawPayload });
      io.emit('invalid-payload', { topic, error: 'JSON inválido', rawPayload });
    }
  });
}

export function subscribeTopic(topic) {
  if (client && connectionStatus === 'connected') client.subscribe(topic);
}
