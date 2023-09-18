DROP DATABASE IF EXISTS tdbi;
CREATE DATABASE tdbi;
USE tdbi;

CREATE TABLE IF NOT EXISTS catalog(
  id int NOT NULL AUTO_INCREMENT,
  image varchar(255),
  scientificName varchar(255) NOT NULL,
  commonName varchar(50) NOT NULL,
  category varchar(255) NOT NULL,
  origin varchar(255) NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://spidersworld.eu/1403-large_default/monocentropus-balfouri-adult-female-socotra-island-blue-baboon.jpg",
"Monocentropus Balfouri",
"Socotra Blue Baboon",
"Old World Terrestrial",
"Socotra/Yemen");

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://spidersworld.eu/1446-large_default/psalmopoeus-irminia-female-7cm-suntiger-tarantula.jpg",
"Psalmopoeus Irminia",
"Venezuelan Suntiger",
"New World Arboreal",
"Venezuela");

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://spidersworld.eu/1349-large_default/brachypelma-hamorii-female-45cm-10cm-red-knee-tarantula.jpg",
"Brachypelma Hamorii",
"Mexican Red Knee",
"New World Terrestrial",
"Mexico");