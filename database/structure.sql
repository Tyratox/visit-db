CREATE TABLE IF NOT EXISTS `cases` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `case_number` varchar(100) NOT NULL,
  `case_type_id` int(11) UNSIGNED NOT NULL,
  `patient_number` varchar(100) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('m','f','other') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `case_type_id` (`case_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `case_types` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `abbreviation` varchar(25) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `disciplines` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `hospitals` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `abbreviation` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `stations` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `substances` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `atc_code` varchar(25) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ksa_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `visits` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `duration` time NOT NULL,
  `patient_count` int(11) UNSIGNED NOT NULL,
  `comment` varchar(500) NOT NULL,
  `visit_type_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `hospital_id` int(11) UNSIGNED NOT NULL,
  `discipline_id` int(11) UNSIGNED NOT NULL,
  `station_id` int(11) UNSIGNED NOT NULL,
  `case_id` int(11) UNSIGNED NOT NULL,
  `substance_id` int(11) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`),
  KEY `discipline_id` (`discipline_id`),
  KEY `hospital_id` (`hospital_id`),
  KEY `station_id` (`station_id`),
  KEY `substance_id` (`substance_id`),
  KEY `user_id` (`user_id`),
  KEY `visit_type_id` (`visit_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `visit_fields` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(25) NOT NULL,
  `content` varchar(500) NOT NULL,
  `visit_id` int(11) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `visit_id` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE IF NOT EXISTS `visit_overview` (
`id` int(11) unsigned
,`date` date
,`username` varchar(50)
,`hospital` varchar(100)
,`discipline` varchar(100)
,`station` varchar(100)
,`case_number` varchar(100)
,`patient_number` varchar(100)
,`date_of_birth` date
,`gender` enum('m','f','other')
,`atc_code` varchar(25)
,`substance` varchar(100)
);

CREATE TABLE IF NOT EXISTS `visit_types` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
DROP TABLE IF EXISTS `visit_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `visit_overview`  AS  select `id` AS `id`,`date` AS `date`,`users`.`username` AS `username`,`hospitals`.`name` AS `hospital`,`disciplines`.`name` AS `discipline`,`stations`.`name` AS `station`,`cases`.`case_number` AS `case_number`,`cases`.`patient_number` AS `patient_number`,`cases`.`date_of_birth` AS `date_of_birth`,`cases`.`gender` AS `gender`,`substances`.`atc_code` AS `atc_code`,`substances`.`name` AS `substance` from ((((((`visits` left join `users` on((`user_id` = `users`.`id`))) left join `hospitals` on((`hospital_id` = `hospitals`.`id`))) left join `disciplines` on((`discipline_id` = `disciplines`.`id`))) left join `stations` on((`station_id` = `stations`.`id`))) left join `cases` on((`case_id` = `cases`.`id`))) left join `substances` on((`substance_id` = `substances`.`id`))) ;


ALTER TABLE `cases`
  ADD CONSTRAINT `cases_ibfk_1` FOREIGN KEY (`case_type_id`) REFERENCES `cases` (`id`) ON UPDATE CASCADE;

ALTER TABLE `visits`
  ADD CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `visits_ibfk_3` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `visits_ibfk_4` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `visits_ibfk_5` FOREIGN KEY (`substance_id`) REFERENCES `substances` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `visits_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `visits_ibfk_7` FOREIGN KEY (`visit_type_id`) REFERENCES `visit_types` (`id`) ON UPDATE CASCADE;

ALTER TABLE `visit_fields`
  ADD CONSTRAINT `visit_fields_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `visit_fields` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
