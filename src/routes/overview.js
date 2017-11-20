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
	response.header("Content-Type", "text/html");

	const visitsPerPerson = (await loadAll(
		db,
		`SELECT
		users.id as user_id,
		users.username as name,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		patients.correction_count
		FROM visits
		LEFT JOIN users ON visits.user_id=users.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM patients
			GROUP BY patients.visit_id
		) as patients ON visits.id=patients.visit_id
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
		patients.correction_count
		FROM visits
		LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM patients
			GROUP BY patients.visit_id
		) as patients ON visits.id=patients.visit_id
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
		patients.correction_count
		FROM visits
		LEFT JOIN stations ON visits.station_id=stations.id
		LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM patients
			GROUP BY patients.visit_id
		) as patients ON visits.id=patients.visit_id
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
