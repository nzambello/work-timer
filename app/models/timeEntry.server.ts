import type { User, TimeEntry, Project } from '@prisma/client'

import { prisma } from '~/db.server'

export type { TimeEntry } from '@prisma/client'

export function getTimeEntry({
  id,
  userId
}: Pick<TimeEntry, 'id'> & {
  userId: User['id']
}) {
  return prisma.timeEntry.findFirst({
    where: { id, userId }
  })
}

export function getTimeEntries({
  userId,
  projectId,
  page,
  offset,
  orderBy
}: {
  userId: User['id']
  projectId?: Project['id']
  page?: number
  offset?: number
  orderBy?: { [key in keyof TimeEntry]?: 'asc' | 'desc' }
}) {
  return prisma.timeEntry.findMany({
    where: { userId, projectId },
    orderBy: orderBy || { updatedAt: 'desc' },
    skip: page && offset ? page * offset : 0,
    take: offset
  })
}

export function createTimeEntry({
  description,
  startTime,
  endTime,
  userId,
  projectId
}: Pick<TimeEntry, 'description' | 'startTime' | 'endTime'> & {
  userId: User['id']
  projectId: Project['id']
}) {
  return prisma.timeEntry.create({
    data: {
      description,
      startTime,
      endTime,
      projectId,
      userId
    }
  })
}

export function updateTimeEntry({
  timeEntryId,
  description,
  startTime,
  endTime,
  projectId
}: Partial<Pick<TimeEntry, 'description' | 'startTime' | 'endTime' | 'projectId'>> & {
  timeEntryId: TimeEntry['id']
}) {
  return prisma.timeEntry.update({
    data: {
      description,
      startTime,
      endTime,
      projectId
    },
    where: {
      id: timeEntryId
    }
  })
}

export function deleteNote({ id, userId }: Pick<TimeEntry, 'id'> & { userId: User['id'] }) {
  return prisma.timeEntry.deleteMany({
    where: { id, userId }
  })
}
