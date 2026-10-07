CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius` real NOT NULL
);
--> statement-breakpoint
ALTER TABLE `attendance` ADD `reason` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `note` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `letter` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `latitude` real;--> statement-breakpoint
ALTER TABLE `attendance` ADD `longitude` real;--> statement-breakpoint
ALTER TABLE `attendance` ADD `accuracy` real;--> statement-breakpoint
ALTER TABLE `attendance` ADD `distance` real;