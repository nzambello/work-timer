import type { User, TimeEntry, Project } from '@prisma/client';

import { prisma } from '~/db.server';

export type { TimeEntry } from '@prisma/client';

export function getTimeEntry({
  id,
  userId
}: Pick<TimeEntry, 'id'> & {
  userId: User['id'];
}) {
  return prisma.timeEntry.findFirst({
    where: { id, userId },
    include: {
      project: true
    }
  });
}

export async function getTimeEntries({
  userId,
  projectId,
  page,
  size,
  orderBy,
  order
}: {
  userId: User['id'];
  projectId?: Project['id'];
  page?: number;
  size?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}) {
  const totalTimeEntries = await prisma.timeEntry.count({
    where: { userId, projectId }
  });
  const paginatedEntries = await prisma.timeEntry.findMany({
    where: { userId, projectId },
    include: {
      project: true
    },
    orderBy: {
      [orderBy || 'startTime']: order || 'desc'
    },
    skip: page && size ? (page - 1) * size : 0,
    take: size
  });

  const monthAgo = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const weekAgo = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() - 7
  );
  const monthEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      projectId,
      startTime: { gte: monthAgo },
      endTime: { lte: new Date() }
    }
  });
  const monthTotalHours =
    monthEntries.reduce(
      (acc, entry) =>
        acc +
        ((entry.endTime || new Date(Date.now())).getTime() -
          entry.startTime.getTime()),
      0
    ) /
    1000 /
    60 /
    60;
  const weekTotalHours =
    monthEntries
      .filter((e) => e.startTime >= weekAgo)
      .reduce(
        (acc, entry) =>
          acc +
          ((entry.endTime || new Date(Date.now())).getTime() -
            entry.startTime.getTime()),
        0
      ) /
    1000 /
    60 /
    60;

  const nextPage =
    page && size && totalTimeEntries > page * size ? page + 1 : null;
  const previousPage = page && page > 2 ? page - 1 : null;

  return {
    total: totalTimeEntries,
    monthTotalHours,
    weekTotalHours,
    timeEntries: paginatedEntries,
    nextPage,
    previousPage
  };
}

export function getTimeEntriesByDateAndProject({
  userId,
  dateFrom,
  dateTo
}: {
  userId: User['id'];
  dateFrom: Date;
  dateTo: Date;
}) {
  return prisma.timeEntry.groupBy({
    by: ['projectId'],
    _sum: {
      duration: true
    },
    where: {
      userId,
      startTime: { gte: dateFrom, lte: dateTo }
    }
  });
}

export function createTimeEntry({
  description,
  startTime,
  endTime,
  duration,
  userId,
  projectId
}: Pick<TimeEntry, 'description' | 'startTime' | 'endTime' | 'duration'> & {
  userId: User['id'];
  projectId: Project['id'];
}) {
  return prisma.timeEntry.create({
    data: {
      description,
      startTime,
      endTime,
      duration,
      projectId,
      userId
    }
  });
}

export async function updateDuration(userId: User['id']) {
  const timeEntriesWithoutDuration = await prisma.timeEntry.findMany({
    where: {
      userId,
      endTime: { not: null },
      duration: null
    }
  });

  return Promise.all(
    timeEntriesWithoutDuration.map(
      async (entry) =>
        await prisma.timeEntry.update({
          where: { id: entry.id },
          data: {
            duration:
              (entry.endTime || new Date(Date.now())).getTime() -
              entry.startTime.getTime()
          }
        })
    )
  );
}

export async function stopAllTimeEntries(userId: User['id']) {
  await updateDuration(userId);

  return prisma.timeEntry.updateMany({
    where: { userId, endTime: null },
    data: { endTime: new Date() }
  });
}

export function updateTimeEntry({
  timeEntryId,
  description,
  startTime,
  endTime,
  duration,
  projectId
}: Partial<
  Pick<
    TimeEntry,
    'description' | 'startTime' | 'endTime' | 'duration' | 'projectId'
  >
> & {
  timeEntryId: TimeEntry['id'];
}) {
  return prisma.timeEntry.update({
    data: {
      description,
      startTime,
      endTime,
      duration,
      projectId
    },
    where: {
      id: timeEntryId
    }
  });
}

export function deleteTimeEntry({
  id,
  userId
}: Pick<TimeEntry, 'id'> & { userId: User['id'] }) {
  return prisma.timeEntry.deleteMany({
    where: { id, userId }
  });
}

export async function exportTimeEntries({ userId }: { userId: User['id'] }) {
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      description: true,
      startTime: true,
      endTime: true,
      duration: true,
      createdAt: true,
      project: {
        select: {
          name: true
        }
      }
    }
  });

  return entries.map((entry) => ({
    ...entry,
    project: entry.project?.name
  }));
}
