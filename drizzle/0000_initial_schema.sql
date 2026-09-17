CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`game` text DEFAULT 'lol' NOT NULL,
	`title` text NOT NULL,
	`rules_json` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`visibility` text DEFAULT 'unlisted' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `challenges_owner_idx` ON `challenges` (`owner_id`);--> statement-breakpoint
CREATE INDEX `challenges_window_idx` ON `challenges` (`ends_at`,`starts_at`);--> statement-breakpoint
CREATE TABLE `match_cache` (
	`match_id` text NOT NULL,
	`puuid` text NOT NULL,
	`game` text DEFAULT 'lol' NOT NULL,
	`played_at` integer NOT NULL,
	`summary_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`match_id`, `puuid`)
);
--> statement-breakpoint
CREATE INDEX `match_cache_player_idx` ON `match_cache` (`puuid`,`played_at`);--> statement-breakpoint
CREATE TABLE `participants` (
	`challenge_id` text NOT NULL,
	`riot_account_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`challenge_id`, `riot_account_id`),
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`riot_account_id`) REFERENCES `riot_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `participants_account_idx` ON `participants` (`riot_account_id`);--> statement-breakpoint
CREATE TABLE `poll_state` (
	`puuid` text NOT NULL,
	`game` text DEFAULT 'lol' NOT NULL,
	`last_match_id` text,
	`last_polled_at` integer,
	`next_poll_after` integer,
	`failure_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`puuid`, `game`)
);
--> statement-breakpoint
CREATE INDEX `poll_state_due_idx` ON `poll_state` (`next_poll_after`);--> statement-breakpoint
CREATE TABLE `progress` (
	`challenge_id` text NOT NULL,
	`riot_account_id` text NOT NULL,
	`rule_index` integer NOT NULL,
	`current` integer DEFAULT 0 NOT NULL,
	`target` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`challenge_id`, `riot_account_id`, `rule_index`)
);
--> statement-breakpoint
CREATE TABLE `riot_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`puuid` text NOT NULL,
	`game_name` text NOT NULL,
	`tag_line` text NOT NULL,
	`platform` text NOT NULL,
	`region` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `riot_accounts_puuid_unique` ON `riot_accounts` (`puuid`);--> statement-breakpoint
CREATE INDEX `riot_accounts_user_idx` ON `riot_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);