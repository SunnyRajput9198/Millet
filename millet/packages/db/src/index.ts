import { PrismaClient } from '@prisma/client'

// Singleton pattern to prevent multiple Prisma Client instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  })

// In development, save the prisma instance to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown handlers
const cleanup = async () => {
  try {
    await prisma.$disconnect()
    console.log('Prisma disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting Prisma:', error)
  }
}

// Handle process termination
process.on('beforeExit', cleanup)
process.on('SIGINT', async () => {
  await cleanup()
  process.exit(0)
})
process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(0)
})

export * from '@prisma/client'
// if export me error aye to package.json me jake type ko module krdo