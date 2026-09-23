import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 

async function run() { 
  const user = await prisma.user.findFirst(); 
  const project = await prisma.project.findFirst(); 
  if(!project || !user) return console.log('no project or user'); 
  
  const job = await prisma.buildJob.create({ 
    data: { 
      projectId: project.id, 
      targetPlatform: 'WINDOWS', 
      triggeredById: user.id 
    } 
  }); 
  console.log('Created job:', job.id); 
} 
run();
