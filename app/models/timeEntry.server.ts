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

export function createTimeEntry({
  description,
  startTime,
  endTime,
  userId,
  projectId
}: Pick<TimeEntry, 'description' | 'startTime' | 'endTime'> & {
  userId: User['id'];
  projectId: Project['id'];
}) {
  return prisma.timeEntry.create({
    data: {
      description,
      startTime,
      endTime,
      projectId,
      userId
    }
  });
}

export function stopAllTimeEntries(userId: User['id']) {
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
  projectId
}: Partial<
  Pick<TimeEntry, 'description' | 'startTime' | 'endTime' | 'projectId'>
> & {
  timeEntryId: TimeEntry['id'];
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
