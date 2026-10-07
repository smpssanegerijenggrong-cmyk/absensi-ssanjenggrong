CREATE TABLE `classrooms` (
	`name` text PRIMARY KEY NOT NULL,
	`teacher` text DEFAULT '' NOT NULL,
	`room` text DEFAULT '' NOT NULL
);
