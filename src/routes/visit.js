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

module.exports.get = [
	celebrate({
		params: {
			visitId: Joi.number().positive()
		}
	}),
	async (request, response) => {
		response.header("Content-Type", "text/html");

		const { visitId } = request.params;

		const template = prepareTemplate(
			path.resolve(__dirname, "..", "templates", "pages", "visit.ejs")
		);

		const visit = await get(
			db,
			`SELECT
			visits.id as id,
			visits.date as date,
			visits.duration as duration,
			visits.patient_count as patient_count,
			visit_types.name as visit_type_name,
			users.username as username,
			hospitals.name as hospital_name,
			disciplines.name as discipline_name,
			stations.name as station_name
			FROM visits
			LEFT JOIN visit_types ON visits.visit_type_id=visit_types.id
			LEFT JOIN users ON visits.user_id=users.id
			LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
			LEFT JOIN disciplines ON visits.discipline_id=disciplines.id
			LEFT JOIN stations ON visits.station_id=stations.id
			WHERE visits.id = ?
			`,
			[visitId]
		);

		const patients = await Promise.all(
			(await loadAll(
				db,
				`SELECT
			patients.id,
			patients.patient_number,
			patients.date_of_birth,
			patients.gender,
			cases.case_number,
			substances.atc_code,
			substances.name as substance_name,
			case_types.abbreviation as case_type_abbreviation,
			case_types.name as case_type_name
			FROM patients
			LEFT JOIN cases ON patients.case_id=cases.id
			LEFT JOIN case_types ON cases.case_type_id=case_types.id
			LEFT JOIN substances ON patients.substance_id=substances.id
			WHERE patients.visit_id = ?
			`,
				[visitId]
			)).map(patient => {
				return loadAll(
					db,
					`SELECT title, content FROM
				patient_fields
				WHERE patient_id = ?
				`,
					[patient.id]
				).then(fields => {
					return Promise.resolve({ ...patient, fields });
				});
			})
		);

		const fields = await loadAll(
			db,
			`SELECT title, content FROM
			patient_fields
			LEFT JOIN patients ON patient_fields.patient_id=patients.id
			WHERE patients.visit_id = ?
			`,
			[visitId]
		);

		response.end(template({ visit, patients, fields }));
	}
];
