import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const email = 'nicola@nzambello.dev';
  const adminEmail = 'admin@nzambello.dev';

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  // cleanup the existing database
  await prisma.user.delete({ where: { email: adminEmail } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash('rawmaterial', 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      admin: true,
      password: {
        create: {
          hash: hashedPassword
        }
      }
    }
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword
        }
      }
    }
  });

  const project = await prisma.project.create({
    data: {
      name: 'RawMaterial',
      description:
        'Raw Material is a web app for managing your projects and tasks.',
      color: 'green',
      userId: user.id
    }
  });
  const otherProject = await prisma.project.create({
    data: {
      name: 'Memori',
      description: 'Memori is a web app for managing your memories.',
      color: 'violet',
      userId: user.id
    }
  });

  new Array(10).fill(0).forEach(async (_, index) => {
    await prisma.project.create({
      data: {
        name: `Project ${index}`,
        description: `Project ${index} description`,
        color: 'red',
        userId: user.id
      }
    });
  });

  await prisma.timeEntry.create({
    data: {
      description: 'Initial setup',
      startTime: new Date('2021-01-01T09:00:00.000Z'),
      endTime: new Date('2021-01-01T12:00:00.000Z'),
      projectId: project.id,
      userId: user.id
    }
  });
  await prisma.timeEntry.create({
    data: {
      description: 'Database setup same day',
      startTime: new Date('2021-01-01T13:00:00.000Z'),
      endTime: new Date('2021-01-01T19:00:00.000Z'),
      projectId: otherProject.id,
      userId: user.id
    }
  });
  await prisma.timeEntry.create({
    data: {
      description: 'Database setup next day',
      startTime: new Date('2021-01-02T13:00:00.000Z'),
      endTime: new Date('2021-01-02T19:00:00.000Z'),
      projectId: otherProject.id,
      userId: user.id
    }
  });
  await prisma.timeEntry.create({
    data: {
      description: 'Ongoing activity',
      startTime: new Date('2021-01-02T13:00:00.000Z'),
      projectId: project.id,
      userId: user.id
    }
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
