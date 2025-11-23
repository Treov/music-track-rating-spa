import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const ventoandaUser = await db.select().from(users).where(eq(users.username, 'ventoanda')).limit(1);
    const pumkingottUser = await db.select().from(users).where(eq(users.username, 'pumkingott')).limit(1);

    if (!ventoandaUser.length || !pumkingottUser.length) {
        throw new Error('Required users not found. Please run the users seeder first.');
    }

    const currentTimestamp = new Date().toISOString();

    const samplePermissions = [
        {
            userId: ventoandaUser[0].id,
            canEditOthersRatings: true,
            canDeleteOthersRatings: true,
            canVerifyArtists: true,
            canAddArtists: true,
            canDeleteArtists: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: pumkingottUser[0].id,
            canEditOthersRatings: true,
            canDeleteOthersRatings: true,
            canVerifyArtists: true,
            canAddArtists: true,
            canDeleteArtists: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(userPermissions).values(samplePermissions);
    
    console.log('✅ User permissions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});