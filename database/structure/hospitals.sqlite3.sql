CREATE TABLE IF NOT EXISTS `hospitals` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `abbreviation` varchar(50) NOT NULL
,  `name` varchar(100) NOT NULL
);