import { db } from '@/db';
import { users } from '@/db/schema';
import * as bcrypt from 'bcryptjs';

async function main() {
    const currentDate = new Date().toISOString();

    const sampleUsers = [
        {
            username: 'ventoanda',
            passwordHash: bcrypt.hashSync('20162016', 10),
            displayName: 'Vento Anda',
            avatarUrl: null,
            bio: null,
            role: 'super_admin',
            isVerified: true,
            isBanned: false,
            tracksRatedCount: 0,
            tracksAddedCount: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            username: 'pumkingott',
            passwordHash: bcrypt.hashSync('sound2025', 10),
            displayName: 'Pumkin Gott',
            avatarUrl: null,
            bio: null,
            role: 'super_admin',
            isVerified: true,
            isBanned: false,
            tracksRatedCount: 0,
            tracksAddedCount: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
    ];

    await db.insert(users).values(sampleUsers).returning();
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});