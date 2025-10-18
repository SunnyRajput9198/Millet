import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
export * from '@prisma/client';
// if export me error aye to package.json me jake type ko module krdo