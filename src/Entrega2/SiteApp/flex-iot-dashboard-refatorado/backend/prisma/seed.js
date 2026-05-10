import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@flex.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@flex.com', passwordHash, role: 'ADMIN' }
  });

  const ambiente = await prisma.environment.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Sala Museu 1', description: 'Ambiente padrão do projeto' }
  });

  await prisma.device.upsert({
    where: { code: 'sensor_01' },
    update: {},
    create: {
      name: 'Sensor 01',
      code: 'sensor_01',
      mqttTopic: 'flex/sala_museu_1/sensor_01',
      environmentId: ambiente.id,
      minTemperature: 18,
      maxTemperature: 35,
      minHumidity: 30,
      maxHumidity: 75,
      maxGas: 700
    }
  });

  console.log('Seed concluído. Login: admin@flex.com / admin123');
}

main().finally(() => prisma.$disconnect());
