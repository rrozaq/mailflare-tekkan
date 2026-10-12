-- A plain user the admin lets add accounts. Accounts they add stay owned by
-- the admin in created_by_user_id; added_by_user_id records who may manage them.
ALTER TABLE `users` ADD `can_add_accounts` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `added_by_user_id` text REFERENCES `users`(`id`) ON DELETE set null;
