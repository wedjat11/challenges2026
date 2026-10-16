CREATE TABLE `auth_email_throttle` (
	`identifier` text PRIMARY KEY NOT NULL,
	`last_sent_at` integer NOT NULL,
	`window_started_at` integer NOT NULL,
	`sent_in_window` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
