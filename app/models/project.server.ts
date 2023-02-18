import type { User, Project } from '@prisma/client';

import { prisma } from '~/db.server';

export type { Project } from '@prisma/client';

export function getProject({
  id,
  userId
}: Pick<Project, 'id'> & {
  userId: User['id'];
}) {
  return prisma.project.findFirst({
    where: { id, userId }
  });
}

export function getProjectByName({
  name,
  userId
}: Pick<Project, 'name'> & {
  userId: User['id'];
}) {
  return prisma.project.findFirst({
    where: { name, userId }
  });
}

export async function getProjects({
  userId,
  page,
  size,
  orderBy,
  order
}: {
  userId: User['id'];
  page?: number;
  size?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}) {
  const totalProjects = await prisma.project.count({
    where: { userId }
  });
  const paginatedProjects = await prisma.project.findMany({
    where: { userId },
    orderBy: {
      [orderBy || 'createdAt']: order || 'desc'
    },
    skip: page && size ? (page - 1) * size : 0,
    take: size
  });

  const nextPage =
    page && size && totalProjects > page * size ? page + 1 : null;
  const previousPage = page && page > 2 ? page - 1 : null;

  return {
    total: totalProjects,
    projects: paginatedProjects,
    nextPage,
    previousPage
  };
}

export function createProject({
  name,
  description,
  color,
  userId
}: Pick<Project, 'name' | 'description' | 'color'> & {
  userId: User['id'];
}) {
  return prisma.project.create({
    data: {
      name,
      description,
      color,
      userId
    }
  });
}

export function updateProject({
  projectId,
  name,
  description,
  color
}: Partial<Pick<Project, 'name' | 'description' | 'color'>> & {
  projectId: Project['id'];
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
  });
}

export function deleteProject({
  id,
  userId
}: Pick<Project, 'id'> & { userId: User['id'] }) {
  return prisma.project.deleteMany({
    where: { id, userId }
  });
}
