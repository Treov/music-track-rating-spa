import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tracks = sqliteTable('tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  albumArt: text('album_art'),
  vocals: integer('vocals').notNull(),
  production: integer('production').notNull(),
  lyrics: integer('lyrics').notNull(),
  originality: integer('originality').notNull(),
  vibe: integer('vibe').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});