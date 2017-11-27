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

const { unixTimestampToString } = require("../dateutils");

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
			patients.id,
			patients.patient_number,
			patients.date_of_birth,
			patients.gender,
			cases.case_number,
			substances.atc_code,
			substances.name as substance_name,
			case_types.abbreviation as case_type_abbreviation,
			case_types.name as case_type_name,
			visits.date as date,
			visits.duration as duration,
			visits.patient_count as patient_count,
			visit_types.name as visit_type_name,
			users.username as username,
			hospitals.name as hospital_name,
			hospitals.abbreviation as hospital_abbreviation,
			disciplines.name as discipline_name,
			stations.name as station_name
			FROM patients
			LEFT JOIN cases ON patients.case_id=cases.id
			LEFT JOIN case_types ON cases.case_type_id=case_types.id
			LEFT JOIN visits ON patients.visit_id=visits.id
			LEFT JOIN visit_types ON visits.visit_type_id=visit_types.id
			LEFT JOIN users ON visits.user_id=users.id
			LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
			LEFT JOIN disciplines ON visits.discipline_id=disciplines.id
			LEFT JOIN stations ON visits.station_id=stations.id
			WHERE 1=1
			${visitTypeId ? "AND visits.visit_type_id = $visitTypeId" : ""}
			`,
			{
				$visitTypeId: visitTypeId ? visitTypeId : undefined
			}
		)).map(row => {
			return (
				'"' +
				[
					unixTimestampToString(row.date),
					row.duration,
					row.patient_count,
					row.username,
					row.hospital_abbreviation,
					row.hospital_name,
					row.discipline_name,
					row.station_name,
					row.patient_number,
					row.date_of_birth,
					row.gender,
					row.substance_name,
					row.atc_code,
					row.case_number,
					row.case_type_abbreviation,
					row.case_type_name
				].join('","') +
				'"'
			);
		});

		response.setHeader("Content-type", "application/octet-stream");
		response.setHeader(
			"Content-Disposition",
			"attachment; filename=export.csv"
		);
		response.send(
			'"' +
				[
					"Datum",
					"Dauer (in Minuten)",
					"Anzahl Patienten",
					"Pharm.",
					"Spital (Abkürzung)",
					"Spital",
					"Disziplin",
					"Station",
					"Patientennummer",
					"Geburtsdatum",
					"Geschlecht",
					"Wirkstoff",
					"ATC",
					"Fallnummer",
					"Falltyp (Abkürzung)",
					"Falltyp"
				].join('","') +
				'"' +
				"\n" +
				rows.join("\n")
		);
	}
];
