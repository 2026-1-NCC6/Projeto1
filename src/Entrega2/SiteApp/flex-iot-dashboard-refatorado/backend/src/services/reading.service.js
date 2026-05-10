import { prisma } from '../lib/prisma.js';
import { logSystem } from '../utils/logger.js';

export function validatePayload(payload) {
  const errors = [];

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return ['Payload precisa ser um JSON objeto'];
  }

  const numericFields = ['temperature', 'humidity', 'pressure', 'gas'];
  for (const field of numericFields) {
    if (payload[field] !== undefined && typeof payload[field] !== 'number') {
      errors.push(`${field} deve ser numérico`);
    }
  }

  if (payload.fogo !== undefined && typeof payload.fogo !== 'boolean') {
    errors.push('fogo deve ser booleano');
  }

  if (payload.estado !== undefined && typeof payload.estado !== 'string') {
    errors.push('estado deve ser texto');
  }

  return errors;
}

export async function processReading({ topic, payload, rawPayload, io }) {
  const device = await prisma.device.findFirst({ where: { mqttTopic: topic, active: true }, include: { environment: true } });

  if (!device) {
    await logSystem('MQTT', 'Mensagem recebida em tópico não cadastrado', 'WARN', { topic, rawPayload });
    io.emit('system-log', { source: 'MQTT', message: 'Tópico não cadastrado', topic });
    return null;
  }

  const validationErrors = validatePayload(payload);
  if (validationErrors.length) {
    await prisma.alert.create({
      data: { deviceId: device.id, type: 'PAYLOAD_INVALIDO', message: validationErrors.join('; ') }
    });
    await logSystem('VALIDACAO', 'Payload inválido', 'ERROR', { topic, validationErrors, rawPayload });
    io.emit('invalid-payload', { topic, validationErrors, rawPayload });
    return null;
  }

  const reading = await prisma.reading.create({
    data: {
      deviceId: device.id,
      topic,
      temperature: payload.temperature ?? null,
      humidity: payload.humidity ?? null,
      pressure: payload.pressure ?? null,
      gas: payload.gas ?? null,
      fogo: !!payload.fogo,
      estado: payload.estado ?? null,
      rawPayload
    },
    include: { device: { include: { environment: true } } }
  });

  let status = payload.estado === 'EMERGENCIA' ? 'EMERGENCIA' : payload.estado === 'ALERTA' ? 'ALERTA' : 'ONLINE';
  await prisma.device.update({ where: { id: device.id }, data: { status, lastSeenAt: new Date() } });

  await evaluateAlerts(device, payload);
  await logSystem('MQTT', `Leitura persistida para ${device.name}`, 'INFO', { topic, payload });

  const enriched = { ...reading, device: { ...reading.device, status } };
  io.emit('reading:new', enriched);
  return enriched;
}

async function createAlert(deviceId, type, message, value) {
  await prisma.alert.create({ data: { deviceId, type, message, value } });
}

async function evaluateAlerts(device, payload) {
  if (payload.fogo) {
    await createAlert(device.id, 'FOGO', 'Fogo detectado — emergência', null);
  }
  if (device.minTemperature !== null && payload.temperature < device.minTemperature) {
    await createAlert(device.id, 'TEMPERATURA', 'Temperatura abaixo do mínimo', payload.temperature);
  }
  if (device.maxTemperature !== null && payload.temperature > device.maxTemperature) {
    await createAlert(device.id, 'TEMPERATURA', 'Temperatura acima do máximo', payload.temperature);
  }
  if (device.minHumidity !== null && payload.humidity < device.minHumidity) {
    await createAlert(device.id, 'UMIDADE', 'Umidade abaixo do mínimo', payload.humidity);
  }
  if (device.maxHumidity !== null && payload.humidity > device.maxHumidity) {
    await createAlert(device.id, 'UMIDADE', 'Umidade acima do máximo', payload.humidity);
  }
  if (device.minPressure !== null && payload.pressure < device.minPressure) {
    await createAlert(device.id, 'PRESSAO', 'Pressão abaixo do mínimo', payload.pressure);
  }
  if (device.maxPressure !== null && payload.pressure > device.maxPressure) {
    await createAlert(device.id, 'PRESSAO', 'Pressão acima do máximo', payload.pressure);
  }
  if (device.maxGas !== null && payload.gas > device.maxGas) {
    await createAlert(device.id, 'GAS', 'Gás acima do limite', payload.gas);
  }
}
