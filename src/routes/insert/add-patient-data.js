const path = require("path");
const { celebrate, Joi } = require("celebrate");

const { db } = require("../../db");
const { prepareTemplate } = require("../../ejsutils");
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert,
	findIdOrInsert,
	remove
} = require("../../dbutils");

const {
	stringToUnixTimestamp,
	unixTimestampToString
} = require("../../dateutils");

const template = prepareTemplate(
	path.resolve(APP_ROOT, "templates", "pages", "patient.ejs")
);

module.exports.get = [
	celebrate({
		query: {
			patient_id: Joi.number().positive()
		}
	}),
	async (request, response) => {
		response.header("Content-Type", "text/html");

		const { visitId } = request.params;
		const { patient_id: patientId } = request.query;

		const substances = await loadAll(
				db,
				"SELECT id, atc_code, name FROM substances"
			),
			caseTypes = await loadAll(
				db,
				"SELECT id, abbreviation, name FROM case_types"
			),
			visit = await get(
				db,
				`SELECT date,
				duration,
				patient_count,
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
				WHERE visits.id = ?`,
				[visitId]
			);
		let patient = {};

		if (patientId) {
			patient = await get(
				db,
				`
				SELECT
				cases.case_number,
				cases.case_type_id as case_type,
				patients.patient_number,
				patients.substance_id as substance,
				patients.gender,
				patients.date_of_birth,
				patients.visit_id
				FROM patients
				LEFT JOIN cases ON patients.case_id=cases.id
				WHERE patients.id = ?`,
				[patientId]
			);
			patient.fields = await loadAll(
				db,
				`
				SELECT
				patient_fields.title,
				patient_fields.content
				FROM patient_fields
				WHERE patient_fields.patient_id = ?`,
				[patientId]
			);
			patient.date_of_birth = unixTimestampToString(patient.date_of_birth);
		}

		response.end(
			template({
				visit: { ...visit, date: unixTimestampToString(visit.date) },
				substances,
				caseTypes,
				...patient
			})
		);
	}
];

module.exports.post = [
	celebrate({
		body: {
			case_number: Joi.string().required(),
			date_of_birth: Joi.string()
				.regex(
					/(^(((0[1-9]|1[0-9]|2[0-8])[\.](0[1-9]|1[012]))|((29|30|31)[\.](0[13578]|1[02]))|((29|30)[\..](0[4,6,9]|11)))[\.](19|[2-9][0-9])\d\d$)|(^29[\.]02[\.](19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)$)/
				)
				.required(),
			case_type: Joi.number()
				.positive()
				.required(),
			patient_number: Joi.string().allow(""),
			gender: Joi.string()
				.valid("male", "female")
				.required(),
			substance: Joi.number()
				.positive()
				.allow(""),
			field_title: Joi.array().items(
				Joi.string()
					.max(25)
					.allow("")
			),
			field_content: Joi.array().items(
				Joi.string()
					.max(500)
					.allow("")
			)
		},
		query: {
			patient_id: Joi.number().positive()
		}
	}),
	async (request, response) => {
		const { visitId } = request.params;
		const {
			case_number,
			date_of_birth,
			case_type,
			patient_number,
			gender,
			substance,
			field_title,
			field_content
		} = request.body;

		const { patient_id: idToUpdate } = request.query;

		if (substance && !await exists(db, "substances", "id", substance)) {
			return next(new Error("The received substance id is invalid!"));
		}

		if (!await exists(db, "case_types", "id", case_type)) {
			return next(new Error("The received case_type id is invalid!"));
		}

		if (field_title.length !== field_content.length) {
			return next(new Error("The field title/content lengths don't match!"));
		}

		const caseId = await findIdOrInsert(
			db,
			"cases",
			"case_number",
			case_number
		);

		let patientId;

		if (idToUpdate) {
			patientId = idToUpdate;

			await update(
				db,
				`
				UPDATE patients
				SET case_id = ?,
				patient_number = ?,
				substance_id = ?,
				gender = ?,
				date_of_birth = ?
			`,
				[
					caseId,
					patient_number,
					substance ? substance : null,
					gender,
					stringToUnixTimestamp(date_of_birth)
				]
			);
		} else {
			patientId = await insert(
				db,
				"INSERT INTO patients(case_id, patient_number, substance_id, gender, date_of_birth, visit_id) VALUES(?, ?, ?, ?, ?, ?)",
				[
					caseId,
					patient_number,
					substance ? substance : null,
					gender,
					stringToUnixTimestamp(date_of_birth),
					visitId
				]
			);
		}

		update(db, "UPDATE cases SET case_type_id = ?", [case_type])
			.then(() => {
				return Promise.all(
					field_title.map((title, index) => {
						if (!title || !field_content[index]) {
							return Promise.resolve();
						}

						return remove(
							db,
							"DELETE FROM patient_fields WHERE patient_id = ?",
							[patientId]
						).then(() => {
							return insert(
								db,
								"INSERT INTO patient_fields (title, content, patient_id) VALUES (?, ?, ?)",
								[title, field_content[index], patientId]
							);
						});
					})
				);
			})
			.then(() => {
				response.redirect("/visit/" + visitId);
			});
	}
];
