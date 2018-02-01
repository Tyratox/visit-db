const path = require("path");
const { celebrate, Joi } = require("celebrate");

const { db } = require("../db");
const { prepareTemplate } = require("../ejsutils");
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert
} = require("../dbutils");

const { unixTimestampToString, formatMinutes } = require("../dateutils");

const template = prepareTemplate(
	path.resolve(APP_ROOT, "templates", "pages", "overview.ejs")
);

module.exports.get = async (request, response) => {
	const visitsPerPerson = (await loadAll(
		db,
		`SELECT
		users.id as user_id,
		users.username as name,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		SUM(CASE WHEN visits.visit_type_id=1 THEN 1 ELSE 0 END) as count_type_1,
		SUM(CASE WHEN visits.visit_type_id=2 THEN 1 ELSE 0 END) as count_type_2,
		SUM(CASE WHEN visits.visit_type_id=3 THEN 1 ELSE 0 END) as count_type_3,
		SUM(interventions.correction_count) as correction_count
		FROM visits
		LEFT JOIN users ON visits.user_id=users.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM interventions
			LEFT JOIN patients ON interventions.patient_id=patients.id
			GROUP BY patients.visit_id
		) as interventions ON visits.id=interventions.visit_id
		GROUP BY visits.user_id
		ORDER BY duration ASC
		`
	)).map(row => {
		return { ...row, duration: formatMinutes(row.duration) };
	});

	const visitsPerHospital = (await loadAll(
		db,
		`SELECT
		hospitals.id as hospital_id,
		hospitals.name as name,
		hospitals.abbreviation as abbreviation,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		SUM(CASE WHEN visits.visit_type_id=1 THEN 1 ELSE 0 END) as count_type_1,
		SUM(CASE WHEN visits.visit_type_id=2 THEN 1 ELSE 0 END) as count_type_2,
		SUM(CASE WHEN visits.visit_type_id=3 THEN 1 ELSE 0 END) as count_type_3,
		SUM(interventions.correction_count) as correction_count
		FROM visits
		LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM interventions
			LEFT JOIN patients ON interventions.patient_id=patients.id
			GROUP BY patients.visit_id
		) as interventions ON visits.id=interventions.visit_id
		GROUP BY visits.hospital_id
		ORDER BY correction_count DESC
		`
	)).map(row => {
		return { ...row, duration: formatMinutes(row.duration) };
	});

	const visitsPerStation = (await loadAll(
		db,
		`SELECT
		stations.id as station_id,
		stations.name as name,
		hospitals.abbreviation as hospital_abbreviation,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		SUM(CASE WHEN visits.visit_type_id=1 THEN 1 ELSE 0 END) as count_type_1,
		SUM(CASE WHEN visits.visit_type_id=2 THEN 1 ELSE 0 END) as count_type_2,
		SUM(CASE WHEN visits.visit_type_id=3 THEN 1 ELSE 0 END) as count_type_3,
		SUM(interventions.correction_count) as correction_count
		FROM visits
		LEFT JOIN stations ON visits.station_id=stations.id
		LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM interventions
			LEFT JOIN patients ON interventions.patient_id=patients.id
			GROUP BY patients.visit_id
		) as interventions ON visits.id=interventions.visit_id
		GROUP BY visits.station_id
		ORDER BY correction_count DESC
		`
	)).map(row => {
		return { ...row, duration: formatMinutes(row.duration) };
	});

	response.end(
		template({
			visitsPerPerson,
			visitsPerHospital,
			visitsPerStation
		})
	);
};
