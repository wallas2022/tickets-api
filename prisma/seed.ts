import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const passwordHash = await bcrypt.hash('Admin1234$', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tickets.com' },
    update: {},
    create: {
      email: 'admin@tickets.com',
      password: passwordHash,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Usuario administrador creado: ${admin.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
