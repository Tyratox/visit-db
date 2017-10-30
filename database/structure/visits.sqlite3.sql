CREATE TABLE IF NOT EXISTS `visits` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `date` date NOT NULL
,  `duration` time NOT NULL
,  `patient_count` integer  NOT NULL
,  `comment` varchar(500) NOT NULL
,  `visit_type_id` integer  NOT NULL
,  `user_id` integer  NOT NULL
,  `hospital_id` integer  NOT NULL
,  `discipline_id` integer  NOT NULL
,  `station_id` integer  NOT NULL
,  `case_id` integer  NOT NULL
,  `substance_id` integer  NOT NULL
);