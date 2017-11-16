const path = require("path");
const { celebrate, Joi } = require("celebrate");

const { db } = require("../db");
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert
} = require("../dbutils");

module.exports = [
	celebrate({
		query: {
			visit_type_id: Joi.number()
				.positive()
				.allow("")
		}
	}),
	async (request, response) => {
		const { visit_type_id: visitTypeId } = request.query;

		const rows = (await loadAll(
			db,
			`SELECT
			visits.id as id,
			visits.date as date,
			visits.duration as duration,
			visits.patient_count as patient_count,
			visit_types.name as visit_type_name,
			users.username as username,
			hospitals.name as hospital_name,
			hospitals.abbreviation as hospital_abbreviation,
			disciplines.name as discipline_name,
			stations.name as station_name
			cases.case_number as case_number,
			cases_types.abbreviation as case_type_abbreviation,
			cases_types.name as case_type_name,
			substances.atc_code as atc_code,
			substances.name as substance_name
			FROM visits
			LEFT JOIN visit_types ON visits.visit_type_id=visit_types.id
			LEFT JOIN users ON visits.user_id=users.id
			LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
			LEFT JOIN disciplines ON visits.discipline_id=disciplines.id
			LEFT JOIN stations ON visits.station_id=stations.id
			LEFT JOIN cases ON visits.case_id=cases.id
			LEFT JOIN case_types ON cases.case_type_id=case_types.id
			LEFT JOIN substances ON visits.substance_id=substances.id
			WHERE 1=1
			${visitTypeId ? "AND visits.visit_type_id = $visitTypeId" : ""}
			`,
			{
				$visitTypeId: visitTypeId ? visitTypeId : undefined
			}
		)).map(row => {
			const d = new Date(row.date);
			return [
				d.getDate() + "." + (d.getMonth() + 1) + d.getFullYear(),
				row.duration,
				row.patient_count,
				row.username,
				row.hospital_abbreviation,
				row.hospital_name,
				row.discipline_name,
				row.station_name,
				row.patient_number,
				row.patient_date_of_birth,
				row.patient_gender,
				row.substance_name,
				row.atc_code
			];
		});
	}
];
