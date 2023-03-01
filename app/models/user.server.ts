import type { Password, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '~/db.server';

export type { User } from '@prisma/client';

export async function getUserById(id: User['id']) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User['email']) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User['email'], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword
        }
      }
    }
  });
}

export async function updateUserEmail(id: User['id'], email: string) {
  return prisma.user.update({
    where: { id },
    data: { email }
  });
}

export async function updateUserPrefs(
  id: User['id'],
  prefs: {
    dateFormat?: User['dateFormat'];
  }
) {
  return prisma.user.update({
    where: { id },
    data: { ...prefs }
  });
}

export async function updateUserPassword(id: User['id'], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.update({
    where: { id },
    data: {
      password: {
        update: {
          hash: hashedPassword
        }
      }
    }
  });
}

export async function deleteUserByEmail(email: User['email']) {
  return prisma.user.delete({ where: { email } });
}

export async function deleteUserById(id: User['id']) {
  return prisma.user.delete({ where: { id } });
}

export async function verifyLogin(
  email: User['email'],
  password: Password['hash']
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true
    }
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function getUsers({
  search,
  page,
  size,
  orderBy,
  order
}: {
  search?: string;
  page?: number;
  size?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}) {
  const totalUsers = await prisma.user.count();
  const filteredTotal = await prisma.user.count({
    where: {
      email: {
        contains: search || undefined
      }
    }
  });
  const paginatedUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: search || undefined
      }
    },
    orderBy: {
      [orderBy || 'createdAt']: order || 'desc'
    },
    skip: page && size ? (page - 1) * size : 0,
    take: size
  });

  const nextPage = page && size && totalUsers > page * size ? page + 1 : null;
  const previousPage = page && page > 2 ? page - 1 : null;

  return {
    total: totalUsers,
    filteredTotal,
    users: paginatedUsers,
    nextPage,
    previousPage
  };
}
