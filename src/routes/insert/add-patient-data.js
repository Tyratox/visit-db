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
	findOrInsert
} = require("../../dbutils");

const template = prepareTemplate(
	path.resolve(__dirname, "..", "..", "templates", "pages", "patient.ejs")
);

module.exports.get = async (request, response) => {
	response.header("Content-Type", "text/html");

	const { visitId } = request.params;

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

	response.end(template({ visit, substances, caseTypes }));
};

module.exports.post = [
	celebrate({
		body: {
			case_number: Joi.string().required(),
			date_of_birth: Joi.string()
				.regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/)
				.required(),
			case_type: Joi.number()
				.positive()
				.required(),
			patient_number: Joi.string().required(),
			gender: Joi.string()
				.valid("male", "female")
				.required(),
			substance: Joi.number().positive(),
			field_title: Joi.array().items(Joi.string().max(25)),
			field_content: Joi.array().items(Joi.string().max(500))
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

		update(
			db,
			"UPDATE cases SET case_type_id = ?, patient_number = ?, date_of_birth = ?, gender = ?",
			[case_type, patient_number, date_of_birth, gender]
		)
			.then(() => {
				return update(db, "UPDATE visits SET case_id = ?, substance_id = ?", [
					caseId,
					substance ? substance : null
				]);
			})
			.then(() => {
				return Promise.all(
					field_title.map((title, index) => {
						return insert(
							db,
							"INSERT INTO visit_fields (title, content, visit_id) VALUES (?, ?, ?)",
							[title, field_content[index], visitId]
						);
					})
				);
			})
			.then(() => {
				response.redirect("/visit/" + visitId);
			});
	}
];
