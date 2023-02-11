import type { User, Project } from '@prisma/client'

import { prisma } from '~/db.server'

export type { Project } from '@prisma/client'

export function getProject({
  id,
  userId
}: Pick<Project, 'id'> & {
  userId: User['id']
}) {
  return prisma.project.findFirst({
    where: { id, userId }
  })
}

export function getProjects({
  userId,
  page,
  offset,
  orderBy
}: {
  userId: User['id']
  page?: number
  offset?: number
  orderBy?: { [key in keyof Project]?: 'asc' | 'desc' }
}) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: orderBy || { updatedAt: 'desc' },
    skip: page && offset ? page * offset : 0,
    take: offset
  })
}

export function createProject({
  name,
  description,
  color,
  userId
}: Pick<Project, 'name' | 'description' | 'color'> & {
  userId: User['id']
}) {
  return prisma.project.create({
    data: {
      name,
      description,
      color,
      userId
    }
  })
}

export function updateProject({
  projectId,
  name,
  description,
  color
}: Partial<Pick<Project, 'name' | 'description' | 'color'>> & {
  projectId: Project['id']
}) {
  return prisma.project.update({
    data: {
      name,
      description,
      color
    },
    where: {
      id: projectId
    }
  })
}

export function deleteProject({ id, userId }: Pick<Project, 'id'> & { userId: User['id'] }) {
  return prisma.project.deleteMany({
    where: { id, userId }
  })
}
