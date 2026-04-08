import { prisma } from '../lib/prisma.js'
import { afterAll } from '@jest/globals';

// runs once after all tests in a file complete
afterAll(async()=>{

    await prisma.refreshToken.deleteMany({
    where: { user: { email: { contains: '@test.com' } } },
  });

   await prisma.user.deleteMany({
    where: { email: { contains: '@test.com' } },
  });

  await prisma.$disconnect();
})