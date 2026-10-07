CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`status` text NOT NULL,
	`method` text NOT NULL,
	`photo` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_per_day` ON `attendance` (`student_id`,`date`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`nis` text NOT NULL,
	`name` text NOT NULL,
	`class_name` text NOT NULL,
	`token` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_nis_unique` ON `students` (`nis`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_token_unique` ON `students` (`token`);