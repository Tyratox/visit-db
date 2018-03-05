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
			interventionProblems = await loadAll(
				db,
				"SELECT id, name FROM intervention_problems"
			),
			interventionReasons = await loadAll(
				db,
				"SELECT id, name FROM intervention_reasons"
			),
			interventionResults = await loadAll(
				db,
				"SELECT id, name, 'order' FROM intervention_results"
			),
			interventionTypes = await loadAll(
				db,
				"SELECT id, name FROM intervention_types"
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
				`SELECT
				cases.case_number,
				cases.case_type_id as case_type,
				patients.patient_number,
				patients.gender,
				patients.date_of_birth,
				patients.visit_id,
				patients.comment
				FROM patients
				LEFT JOIN cases ON patients.case_id=cases.id
				WHERE patients.id = ?`,
				[patientId]
			);
			patient.interventions = await loadAll(
				db,
				`
				SELECT
				drug,
				problem,
				suggestion,
				history_entry,
				advice,
				comment,
				substance_id,
				intervention_problem_id,
				intervention_reason_id,
				intervention_type_id,
				intervention_result_id
				FROM interventions
				WHERE interventions.patient_id = ?`,
				[patientId]
			);
			patient.date_of_birth = unixTimestampToString(patient.date_of_birth);
		}

		response.end(
			template({
				visit: { ...visit, date: unixTimestampToString(visit.date) },
				substances,
				caseTypes,
				interventionProblems,
				interventionReasons,
				interventionResults,
				interventionTypes,
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
				.regex(/[0-9]{1,2}\.[0-9]{1,2}\.([0-9]{4}|[0-9]{2})/)
				.required(),
			case_type: Joi.number()
				.positive()
				.required(),
			patient_number: Joi.string().allow(""),
			gender: Joi.string()
				.valid("male", "female")
				.required(),
			comment: Joi.string()
				.max(2048)
				.allow(""),
			intervention_drug: Joi.array().items(
				Joi.string()
					.max(2048)
					.allow("")
			),
			intervention_problem: Joi.array().items(
				Joi.string()
					.max(2048)
					.allow("")
			),
			intervention_comment: Joi.array().items(
				Joi.string()
					.max(2048)
					.allow("")
			),
			intervention_suggestion: Joi.array().items(
				Joi.string()
					.max(2048)
					.allow("")
			),
			intervention_substance_id: Joi.array().items(Joi.number().positive()),
			intervention_problem_id: Joi.array().items(Joi.number().positive()),
			intervention_reason_id: Joi.array().items(Joi.number().positive()),
			intervention_result_id: Joi.array().items(
				Joi.number()
					.positive()
					.allow("")
			),
			intervention_type_id: Joi.array().items(Joi.number().positive()),
			intervention_history_entry: Joi.array().items(Joi.string()),
			intervention_advice: Joi.array().items(Joi.string())
		},
		query: {
			patient_id: Joi.number().positive()
		}
	}),
	async (request, response, next) => {
		const { visitId } = request.params;
		let {
			case_number,
			date_of_birth,
			case_type,
			patient_number,
			gender,
			substance,
			comment
		} = request.body;

		const { patient_id: idToUpdate } = request.query;

		const intervention_drug = request.body.intervention_drug
				? request.body.intervention_drug
				: [],
			intervention_problem = request.body.intervention_problem
				? request.body.intervention_problem
				: [],
			intervention_suggestion = request.body.intervention_suggestion
				? request.body.intervention_suggestion
				: [],
			intervention_substance_id = request.body.intervention_substance_id
				? request.body.intervention_substance_id
				: [],
			intervention_problem_id = request.body.intervention_problem_id
				? request.body.intervention_problem_id
				: [],
			intervention_reason_id = request.body.intervention_reason_id
				? request.body.intervention_reason_id
				: [],
			intervention_result_id = request.body.intervention_result_id
				? request.body.intervention_result_id
				: [],
			intervention_type_id = request.body.intervention_type_id
				? request.body.intervention_type_id
				: [],
			intervention_comment = request.body.intervention_comment
				? request.body.intervention_comment
				: [],
			intervention_history_entry = request.body.intervention_history_entry
				? request.body.intervention_history_entry.map(b => b === "true")
				: [],
			intervention_advice = request.body.intervention_advice
				? request.body.intervention_advice.map(b => b === "true")
				: [];

		if (
			intervention_drug.length !== intervention_problem.length ||
			intervention_problem.length !== intervention_suggestion.length ||
			intervention_suggestion.length !== intervention_substance_id.length ||
			intervention_substance_id.length !== intervention_problem_id.length ||
			intervention_problem_id.length !== intervention_reason_id.length ||
			intervention_reason_id.length !== intervention_result_id.length ||
			intervention_result_id.length !== intervention_type_id.length ||
			intervention_type_id.length !== intervention_history_entry.length ||
			intervention_history_entry.length !== intervention_advice.length
		) {
			return next(
				new Error("The received intervention array length(s) are invalid")
			);
		}

		if (
			(await Promise.all([
				exists(db, "case_types", "id", case_type),
				...intervention_substance_id.map(id =>
					exists(db, "substances", "id", id)
				),
				...intervention_problem_id.map(id =>
					exists(db, "intervention_problems", "id", id)
				),
				...intervention_reason_id.map(id =>
					exists(db, "intervention_reasons", "id", id)
				),
				...intervention_result_id.map(id => id =>
					id
						? exists(db, "intervention_results", "id", id)
						: Promise.resolve(true)
				)
			])).filter(el => !el).length > 0
		) {
			return next(new Error("Invalid id (length)!"));
		}

		if (substance && !await exists(db, "substances", "id", substance)) {
			return next(new Error("The received substance id is invalid!"));
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
				gender = ?,
				date_of_birth = ?,
				comment = ?
				WHERE
				id = ?
			`,
				[
					caseId,
					patient_number,
					gender,
					stringToUnixTimestamp(date_of_birth),
					comment,
					patientId
				]
			);
		} else {
			patientId = await insert(
				db,
				"INSERT INTO patients(case_id, patient_number, gender, date_of_birth, comment, visit_id) VALUES(?, ?, ?, ?, ?, ?)",
				[
					caseId,
					patient_number,
					gender,
					stringToUnixTimestamp(date_of_birth),
					comment,
					visitId
				]
			);
		}

		update(db, "UPDATE cases SET case_type_id = ? WHERE id = ?", [
			case_type,
			caseId
		])
			.then(() => {
				return remove(db, "DELETE FROM interventions WHERE patient_id = ?", [
					patientId
				]).then(() => {
					return Promise.all([
						intervention_drug.map((drug, index) => {
							return insert(
								db,
								`INSERT INTO
							interventions (
								drug,
								problem,
								suggestion,
								history_entry,
								advice,
								comment,
								patient_id,
								substance_id,
								intervention_problem_id,
								intervention_reason_id,
								intervention_type_id,
								intervention_result_id
							) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
								[
									drug,
									intervention_problem[index],
									intervention_suggestion[index],
									intervention_history_entry[index],
									intervention_advice[index],
									intervention_comment[index],
									patientId,
									intervention_substance_id[index]
										? intervention_substance_id[index]
										: null,
									intervention_problem_id[index],
									intervention_reason_id[index],
									intervention_type_id[index],
									intervention_result_id[index]
										? intervention_result_id[index]
										: null
								]
							);
						})
					]);
				});
			})
			.then(() => {
				response.redirect("/visit/" + visitId + "#patient-id-" + patientId);
			});
	}
];
