CREATE TABLE IF NOT EXISTS `cases` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `case_number` varchar(100) NOT NULL
,  `case_type_id` integer  NOT NULL
,  `patient_number` varchar(100) DEFAULT NULL
,  `date_of_birth` date NOT NULL
,  `gender` text  NOT NULL
);