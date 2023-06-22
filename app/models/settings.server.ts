import type { Settings } from '@prisma/client';

import { prisma } from '~/db.server';

export type { Settings } from '@prisma/client';

export function getSettings() {
  return prisma.settings.findMany();
}

export function getSetting({ id }: { id: Settings['id'] }) {
  return prisma.settings.findFirst({
    where: { id }
  });
}

export function updateSetting({ id, value }: Settings) {
  return prisma.settings.upsert({
    where: { id },
    update: { value },
    create: { id, value }
  });
}
