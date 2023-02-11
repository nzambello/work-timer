import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  const email = 'admin@rawmaterial.it'

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  })

  const hashedPassword = await bcrypt.hash('admin', 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword
        }
      }
    }
  })

  const project = await prisma.project.create({
    data: {
      name: 'RawMaterial',
      description: 'Raw Material is a web app for managing your projects and tasks.',
      color: '#333',
      userId: user.id
    }
  })

  await prisma.timeEntry.create({
    data: {
      description: 'Initial setup',
      startTime: new Date('2021-01-01T09:00:00.000Z'),
      endTime: new Date('2021-01-01T12:00:00.000Z'),
      projectId: project.id,
      userId: user.id
    }
  })
  await prisma.timeEntry.create({
    data: {
      description: 'Database setup',
      startTime: new Date('2021-01-01T13:00:00.000Z'),
      endTime: new Date('2021-01-01T19:00:00.000Z'),
      projectId: project.id,
      userId: user.id
    }
  })

  console.log(`Database has been seeded. 🌱`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
