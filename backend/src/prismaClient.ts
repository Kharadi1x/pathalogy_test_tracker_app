// Some prisma client builds in newer @prisma/client bundles may not expose named exports in
// the TypeScript types in this environment; use require to ensure runtime resolution.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
export default prisma;