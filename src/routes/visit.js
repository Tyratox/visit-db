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

const { unixTimestampToString } = require("../dateutils");

const template = prepareTemplate(
	path.resolve(APP_ROOT, "templates", "pages", "visit.ejs")
);

module.exports.get = [
	celebrate({
		params: {
			visitId: Joi.number().positive()
		}
	}),
	async (request, response) => {
		const { visitId } = request.params;

		let visit = await get(
			db,
			`SELECT
			visits.id as id,
			visits.date as date,
			visits.preparation_duration as preparation_duration,
			visits.duration as duration,
			visits.patient_count as patient_count,
			visit_types.name as visit_type_name,
			users.username as username,
			company.username as company_username,
			hospitals.name as hospital_name,
			disciplines.name as discipline_name,
			stations.name as station_name
			FROM visits
			LEFT JOIN visit_types ON visits.visit_type_id=visit_types.id
			LEFT JOIN users ON visits.user_id=users.id
			LEFT JOIN users as company ON visits.company_user_id=company.id
			LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
			LEFT JOIN disciplines ON visits.discipline_id=disciplines.id
			LEFT JOIN stations ON visits.station_id=stations.id
			WHERE visits.id = ?
			`,
			[visitId]
		);

		visit.date = unixTimestampToString(visit.date);

		const patients = await Promise.all(
			(await loadAll(
				db,
				`SELECT
				patients.id,
				patients.patient_number,
				patients.date_of_birth,
				patients.gender,
				patients.comment,
				cases.case_number,
				case_types.abbreviation as case_type_abbreviation,
				case_types.name as case_type_name,
				case_types.abbreviation as case_type_abbreviation,
				case_types.name as case_type_name
				FROM patients
				LEFT JOIN cases ON patients.case_id=cases.id
				LEFT JOIN case_types ON cases.case_type_id=case_types.id
				WHERE patients.visit_id = ?
			`,
				[visitId]
			)).map(patient => {
				return loadAll(
					db,
					`SELECT
					drug,
					problem,
					suggestion,
					history_entry,
					advice,
					comment,
					substances.name as substance_name,
					substances.atc_code as substance_atc_code,
					intervention_problems.name as problem_class,
					intervention_reasons.name as reason_class,
					intervention_types.name as type_class,
					intervention_results.name as result_class
					FROM interventions
					LEFT JOIN substances ON interventions.substance_id=substances.id
					LEFT JOIN intervention_problems ON interventions.intervention_problem_id=intervention_problems.id
					LEFT JOIN intervention_reasons ON interventions.intervention_reason_id=intervention_reasons.id
					LEFT JOIN intervention_types ON interventions.intervention_type_id=intervention_types.id
					LEFT JOIN intervention_results ON interventions.intervention_result_id=intervention_results.id
					WHERE interventions.patient_id = ?
				`,
					[patient.id]
				).then(interventions => {
					return Promise.resolve({
						...patient,
						date_of_birth: unixTimestampToString(patient.date_of_birth),
						interventions
					});
				});
			})
		);

		response.end(template({ visit, patients }));
	}
];
