import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    await db.delete(users);

    const currentTimestamp = new Date().toISOString();

    const sampleUsers = [
        {
            username: 'ventoanda',
            password_hash: bcrypt.hashSync('20162016', 10),
            display_name: 'Vento Anda',
            avatar_url: null,
            bio: 'Super administrator with full system access',
            role: 'super_admin',
            is_verified: true,
            is_banned: false,
            tracks_rated_count: 0,
            tracks_added_count: 0,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            username: 'pumkingott',
            password_hash: bcrypt.hashSync('sound2025', 10),
            display_name: 'Pumkin Gott',
            avatar_url: null,
            bio: 'Super administrator with full system access',
            role: 'super_admin',
            is_verified: true,
            is_banned: false,
            tracks_rated_count: 0,
            tracks_added_count: 0,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});