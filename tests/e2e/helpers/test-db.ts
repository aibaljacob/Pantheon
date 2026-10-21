import { PrismaClient } from '../../../apps/api/node_modules/@prisma/client/default.js';

export const prisma = new PrismaClient();

export async function verifyUserEmail(email: string): Promise<void> {
  await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { emailVerified: true },
  });
}
