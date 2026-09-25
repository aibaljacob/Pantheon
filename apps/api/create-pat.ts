import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  
  if (!user) return;
  
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await prisma.personalAccessToken.create({
    data: {
      userId: user.id,
      name: 'runner_pat',
      tokenHash,
      prefix: token.substring(0, 8),
    }
  });

  console.log('PAT Token:', token);
}
run().then(() => process.exit(0));
