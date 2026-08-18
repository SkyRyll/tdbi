CREATE DATABASE IF NOT EXISTS tdbi;
USE tdbi;

DROP TABLE IF EXISTS `animal_images`;
DROP TABLE IF EXISTS `animal_molting_dates`;
DROP TABLE IF EXISTS `animal_feeding_dates`;
DROP TABLE IF EXISTS `animals`;
DROP TABLE IF EXISTS `collections`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `catalog_images`;
DROP TABLE IF EXISTS `catalog`;

CREATE TABLE IF NOT EXISTS `catalog` (
  `catalog_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `scientific_name` varchar(255),
  `common_name` varchar(255),
  `category` varchar(255),
  `origin` varchar(255),
  `created_at` datetime,
  `deleted_at` datetime
);

CREATE TABLE IF NOT EXISTS `catalog_images` (
  `catalog_image_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `catalog_id` integer,
  `catalog_image_path` varchar(255),
  `is_main_image` boolean
);

CREATE TABLE IF NOT EXISTS `accounts` (
  `account_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255),
  `first_name` varchar(255),
  `last_name` varchar(255),
  `username` varchar(255),
  `hash` varchar(255),
  `created_at` datetime,
  `deleted_at` datetime
);

CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `account_id` integer,
  `admin_level` integer
);

CREATE TABLE IF NOT EXISTS `collections` (
  `collection_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `account_id` integer,
  `collection_name` varchar(255),
  `description` varchar(255),
  `created_at` datetime,
  `deleted_at` datetime
);

CREATE TABLE IF NOT EXISTS `animals` (
  `animal_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `collection_id` integer,
  `catalog_id` integer,
  `animal_name` varchar(255),
  `notes` varchar(255),
  `received_date` date,
  `sell_date` date,
  `price` decimal,
  `created_at` datetime,
  `deleted_at` datetime
);

CREATE TABLE IF NOT EXISTS `animal_feeding_dates` (
  `feeding_date_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `animal_id` integer,
  `feeding_date` date
);

CREATE TABLE IF NOT EXISTS `animal_molting_dates` (
  `molting_date_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `animal_id` integer,
  `molting_date` date
);

CREATE TABLE IF NOT EXISTS `animal_images` (
  `animal_image_id` integer NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `animal_id` integer,
  `animal_image_path` varchar(255),
  `is_main_image` boolean
);

ALTER TABLE `catalog_images`
  ADD FOREIGN KEY (`catalog_id`) REFERENCES `catalog` (`catalog_id`);

ALTER TABLE `admins`
  ADD FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`);

ALTER TABLE `collections`
  ADD FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`);

ALTER TABLE `animals`
  ADD FOREIGN KEY (`collection_id`) REFERENCES `collections` (`collection_id`);

ALTER TABLE `animals`
  ADD FOREIGN KEY (`catalog_id`) REFERENCES `catalog` (`catalog_id`);

ALTER TABLE `animal_feeding_dates`
  ADD FOREIGN KEY (`animal_id`) REFERENCES `animals` (`animal_id`);

ALTER TABLE `animal_molting_dates`
  ADD FOREIGN KEY (`animal_id`) REFERENCES `animals` (`animal_id`);

ALTER TABLE `animal_images`
  ADD FOREIGN KEY (`animal_id`) REFERENCES `animals` (`animal_id`);

INSERT INTO `accounts`
 (`email`, `first_name`, `last_name`, `username`, `hash`, `created_at`)
 VALUES
 (
    "skyryll1987@gmail.com",
    "Nils",
    "Simon",
    "SkyRyll",
    "$2b$10$ea514b7b8f173ea91358euhwCA1CkWuUgFAC0CVOq6OMXJJvGfdg6",
    now()
 );