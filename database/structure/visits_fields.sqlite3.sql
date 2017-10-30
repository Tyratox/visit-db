CREATE TABLE IF NOT EXISTS `visit_fields` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `title` varchar(25) NOT NULL
,  `content` varchar(500) NOT NULL
,  `visit_id` integer  NOT NULL
);