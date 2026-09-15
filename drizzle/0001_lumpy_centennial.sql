CREATE TABLE `statusLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`treasureId` int NOT NULL,
	`status` enum('Found','Lost','Stolen') NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `statusLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`islandName` varchar(100) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`value` int NOT NULL DEFAULT 0,
	`terrain` varchar(50) DEFAULT 'Coastal',
	`burialDepth` double DEFAULT 0,
	`status` enum('Found','Lost','Stolen') NOT NULL DEFAULT 'Found',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treasures_id` PRIMARY KEY(`id`)
);
