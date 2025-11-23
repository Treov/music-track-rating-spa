import { db } from '@/db';
import { users, userPermissions } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

async function main() {
    // Query users table to get the IDs of ventoanda and pumkingott
    const targetUsers = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(
            or(
                eq(users.username, 'ventoanda'),
                eq(users.username, 'pumkingott')
            )
        );

    // Verify both users exist
    if (targetUsers.length !== 2) {
        throw new Error('Required users not found. Please run the users seeder first.');
    }

    const ventoandaUser = targetUsers.find(u => u.username === 'ventoanda');
    const pumkingottUser = targetUsers.find(u => u.username === 'pumkingott');

    if (!ventoandaUser || !pumkingottUser) {
        throw new Error('Required users not found. Please run the users seeder first.');
    }

    const currentTimestamp = new Date().toISOString();

    const samplePermissions = [
        {
            userId: ventoandaUser.id,
            canEditOthersRatings: true,
            canDeleteOthersRatings: true,
            canVerifyArtists: true,
            canAddArtists: true,
            canDeleteArtists: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: pumkingottUser.id,
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