import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Attempting to connect to the database...')
        await prisma.$connect()
        console.log('Successfully connected to the database!')

        // Attempt a simple query
        const count = await prisma.user.count()
        console.log(`Database query successful. User count: ${count}`)
    } catch (error) {
        console.error('Failed to connect to the database:')
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
