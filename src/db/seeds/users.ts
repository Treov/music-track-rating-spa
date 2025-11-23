import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleUsers = [
        {
            username: 'ventoanda',
            passwordHash: bcrypt.hashSync('20162016', 10),
            displayName: 'Vento Anda',
            avatarUrl: null,
            bio: null,
            role: 'super_admin',
            isBanned: false,
            tracksRatedCount: 0,
            tracksAddedCount: 0,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            username: 'pumkingott',
            passwordHash: bcrypt.hashSync('sound2025', 10),
            displayName: 'Pumkin Gott',
            avatarUrl: null,
            bio: null,
            role: 'super_admin',
            isBanned: false,
            tracksRatedCount: 0,
            tracksAddedCount: 0,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    const result = await db.insert(users).values(sampleUsers).returning({ id: users.id });
    
    console.log('✅ Users seeder completed successfully');
    console.log(`Created super admin accounts with IDs: ${result.map(r => r.id).join(', ')}`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});