import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  imageUrl: text('image_url'),
  verified: integer('verified').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tracks = sqliteTable('tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  albumArt: text('album_art'),
  audioUrl: text('audio_url'),
  vocals: integer('vocals').notNull(),
  production: integer('production').notNull(),
  lyrics: integer('lyrics').notNull(),
  originality: integer('originality').notNull(),
  vibe: integer('vibe').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: text('role').notNull().default('admin'),
  isBanned: integer('is_banned', { mode: 'boolean' }).notNull().default(false),
  tracksRatedCount: integer('tracks_rated_count').notNull().default(0),
  tracksAddedCount: integer('tracks_added_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userPermissions = sqliteTable('user_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  canEditOthersRatings: integer('can_edit_others_ratings', { mode: 'boolean' }).notNull().default(false),
  canDeleteOthersRatings: integer('can_delete_others_ratings', { mode: 'boolean' }).notNull().default(false),
  canVerifyArtists: integer('can_verify_artists', { mode: 'boolean' }).notNull().default(true),
  canAddArtists: integer('can_add_artists', { mode: 'boolean' }).notNull().default(true),
  canDeleteArtists: integer('can_delete_artists', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});