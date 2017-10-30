CREATE TABLE IF NOT EXISTS `substances` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `atc_code` varchar(25) NOT NULL
,  `name` varchar(100) NOT NULL
);