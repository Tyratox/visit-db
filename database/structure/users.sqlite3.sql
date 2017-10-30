CREATE TABLE IF NOT EXISTS `users` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `username` varchar(50) NOT NULL
,  UNIQUE (`username`)
);