import bcrypt from 'bcrypt';
import prisma from '../src/prismaClient';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(adminPass, 10);
    await prisma.user.create({ data: { email: adminEmail, name: 'Admin', password: hashed, role: 'ADMIN' } });
    console.log('Admin user created:', adminEmail);
  } else {
    console.log('Admin already exists');
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());