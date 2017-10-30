CREATE TABLE IF NOT EXISTS `case_types` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `abbreviation` varchar(25) NOT NULL
,  `name` varchar(50) NOT NULL
);