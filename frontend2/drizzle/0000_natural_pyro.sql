CREATE TABLE `account_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`professional_title` text DEFAULT '' NOT NULL,
	`experience_years` integer DEFAULT 0 NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`github_username` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
