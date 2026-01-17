import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });

  await prisma.productItem.deleteMany({
    where: { userId: user.id },
  });
  await prisma.category.deleteMany({
    where: { userId: user.id },
  });

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Fruits',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Vegetables',
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Dairy',
        userId: user.id,
      },
    }),
  ]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await Promise.all([
    prisma.productItem.create({
      data: {
        name: 'Bananas',
        quantity: '1 kg',
        expiryDate: tomorrow,
        isShareable: false,
        userId: user.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.productItem.create({
      data: {
        name: 'Milk',
        quantity: '1L',
        expiryDate: tomorrow,
        isShareable: true,
        userId: user.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.productItem.create({
      data: {
        name: 'Carrots',
        quantity: '500g',
        expiryDate: nextWeek,
        isShareable: false,
        userId: user.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.productItem.create({
      data: {
        name: 'Yogurt',
        quantity: '4x 200g',
        expiryDate: yesterday,
        isShareable: false,
        userId: user.id,
        categoryId: categories[2].id,
      },
    }),
  ]);

  console.log('Seed completed!');
  console.log('Demo user: demo@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
