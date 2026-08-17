import { PrismaClient } from '@prisma/client';
import { initialRoles } from './seed/roles';
import { initialSpecializations } from './seed/specializations';
import { initialSkills } from './seed/skills';
import { initialTools } from './seed/tools';
import { initialGameEngines } from './seed/game-engines';
import { initialGenres } from './seed/genres';
import { initialPlatforms } from './seed/platforms';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Pantheon Game-Dev Taxonomy Seed...');

  // 1. Roles
  for (const item of initialRoles) {
    await prisma.professionalRole.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Roles seeded (${initialRoles.length} items)`);

  // 2. Specializations
  for (const item of initialSpecializations) {
    await prisma.specialization.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Specializations seeded (${initialSpecializations.length} items)`);

  // 3. Skills
  for (const item of initialSkills) {
    await prisma.skill.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Skills seeded (${initialSkills.length} items)`);

  // 4. Tools
  for (const item of initialTools) {
    await prisma.tool.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Tools seeded (${initialTools.length} items)`);

  // 5. Game Engines
  for (const item of initialGameEngines) {
    await prisma.gameEngine.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Game Engines seeded (${initialGameEngines.length} items)`);

  // 6. Genres
  for (const item of initialGenres) {
    await prisma.genre.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Genres seeded (${initialGenres.length} items)`);

  // 7. Platforms
  for (const item of initialPlatforms) {
    await prisma.platform.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: { name: item.name, description: item.description, isActive: true },
    });
  }
  console.log(`✅ Platforms seeded (${initialPlatforms.length} items)`);

  console.log('✨ Pantheon Taxonomy Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during taxonomy seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
