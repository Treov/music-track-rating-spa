ALTER TABLE `artists` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `artists_slug_unique` ON `artists` (`slug`);