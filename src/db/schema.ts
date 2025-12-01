import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
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
  quality: integer('quality').notNull(),
  vibe: integer('vibe').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  display_name: text('display_name'),
  avatar_url: text('avatar_url'),
  bio: text('bio'),
  role: text('role').notNull().default('admin'),
  is_verified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  is_banned: integer('is_banned', { mode: 'boolean' }).notNull().default(false),
  tracks_rated_count: integer('tracks_rated_count').notNull().default(0),
  tracks_added_count: integer('tracks_added_count').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const userPermissions = sqliteTable('user_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id),
  can_edit_others_ratings: integer('can_edit_others_ratings', { mode: 'boolean' }).notNull().default(false),
  can_delete_others_ratings: integer('can_delete_others_ratings', { mode: 'boolean' }).notNull().default(false),
  can_verify_artists: integer('can_verify_artists', { mode: 'boolean' }).notNull().default(true),
  can_add_artists: integer('can_add_artists', { mode: 'boolean' }).notNull().default(true),
  can_delete_artists: integer('can_delete_artists', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const awards = sqliteTable('awards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  icon_url: text('icon_url'),
  color: text('color'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const userAwards = sqliteTable('user_awards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id),
  award_id: integer('award_id').notNull().references(() => awards.id),
  assigned_by: integer('assigned_by').references(() => users.id),
  assigned_at: text('assigned_at').notNull(),
  created_at: text('created_at').notNull(),
});

export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  target_type: text('target_type'),
  target_id: integer('target_id'),
  details: text('details'),
  ip_address: text('ip_address'),
  created_at: text('created_at').notNull(),
});

export const socialLinks = sqliteTable('social_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id),
  platform: text('platform').notNull(),
  url: text('url').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updated_at: text('updated_at').notNull(),
});