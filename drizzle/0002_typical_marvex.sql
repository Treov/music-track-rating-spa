CREATE TABLE `user_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`can_edit_others_ratings` integer DEFAULT false NOT NULL,
	`can_delete_others_ratings` integer DEFAULT false NOT NULL,
	`can_verify_artists` integer DEFAULT true NOT NULL,
	`can_add_artists` integer DEFAULT true NOT NULL,
	`can_delete_artists` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`bio` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`is_banned` integer DEFAULT false NOT NULL,
	`tracks_rated_count` integer DEFAULT 0 NOT NULL,
	`tracks_added_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);