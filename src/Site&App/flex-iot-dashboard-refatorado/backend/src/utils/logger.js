import { prisma } from '../lib/prisma.js';

export async function logSystem(source, message, level = 'INFO', metadata = null) {
  try {
    await prisma.systemLog.create({
      data: { source, message, level, metadata: metadata ? JSON.stringify(metadata) : null }
    });
  } catch (error) {
    console.error('[LOG_ERROR]', error.message);
  }
}
