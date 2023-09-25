CREATE DATABASE IF NOT EXISTS tdbi;
USE tdbi;

DROP TABLE catalog;
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

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://spidersworld.eu/1371-large_default/cyriopagopus-sp-hati-hati-25cm.jpg",
"Cyriopagopus sp. Hatihati",
"Purple Earth Tiger",
"Old World Arboreal",
"Indonesia");

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://upload.wikimedia.org/wikipedia/commons/e/e9/Harpactira_pulchripes01.jpg",
"Harpactira Pulchripes",
"Golden blue-legged Baboon",
"Old World Terrestrial",
"South Africa");

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://www.exoticsunlimitedusa.com/cdn/shop/products/481f4e_2fbd9604310444ba95b11e71552a525f_mv2_60e43bef-ea8d-49bd-8561-ccc0907bfe95.jpg?v=1682317520",
"Lasiocyano Sazimai",
"Brazilian Blue",
"New World Terrestrial",
"Brazil");

INSERT INTO catalog (image, scientificName, commonName, category, origin) VALUES (
"https://argiopeterra.pl/userdata/public/gfx/893/ce7661d7bffe49b8a6b4dc81fde05f6e.jpg",
"Chilobrachys Natanicharum",
"Electric Blue",
"Old World Terrestrial",
"Thailand");