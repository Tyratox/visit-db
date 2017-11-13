CREATE TABLE IF NOT EXISTS `cases` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `case_number` varchar(100) DEFAULT NULL
,  `case_type_id` integer  DEFAULT NULL
,  `patient_number` varchar(100) DEFAULT NULL
,  `date_of_birth` date DEFAULT NULL
,  `gender` text  DEFAULT NULL
);