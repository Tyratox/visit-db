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
	findIdOrInsert
} = require("../../dbutils");

const template = prepareTemplate(
	path.resolve(__dirname, "..", "..", "templates", "pages", "index.ejs")
);

module.exports.get = async (request, response) => {
	response.header("Content-Type", "text/html");

	const stations = await loadAll(db, "SELECT name FROM stations"),
		users = await loadAll(db, "SELECT username FROM users"),
		disciplines = await loadAll(
			db,
			"SELECT id, name, abbreviation FROM disciplines"
		),
		visitTypes = await loadAll(db, "SELECT id, name FROM visit_types"),
		hospitals = await loadAll(db, "SELECT id, name FROM hospitals");

	response.end(
		template({ stations, users, visitTypes, hospitals, disciplines })
	);
};

module.exports.post = [
	celebrate({
		body: {
			username: Joi.string()
				.alphanum()
				.required(),
			date: Joi.string()
				.regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/)
				.required(),
			patient_count: Joi.number()
				.positive()
				.required(),
			visit_type: Joi.number()
				.positive()
				.required(),
			duration: Joi.number()
				.positive()
				.required(),
			hospital: Joi.number()
				.positive()
				.required(),
			station: Joi.string()
				.alphanum()
				.required(),
			discipline: Joi.number()
				.positive()
				.required()
		}
	}),
	async (request, response, next) => {
		const {
			username,
			date,
			patient_count,
			visit_type,
			duration,
			hospital,
			station,
			discipline
		} = request.body;

		if (!await exists(db, "disciplines", "id", discipline)) {
			return next(new Error("The received discipline id is ivalid!"));
		}

		if (!await exists(db, "hospitals", "id", hospital)) {
			return next(new Error("The received hospital id is ivalid!"));
		}

		//Find the right user
		const userId = await findIdOrInsert(db, "users", "username", username),
			jsDate = new Date(
				date.substring(6),
				date.substring(3, 5) - 1,
				date.substring(0, 2)
			),
			stationId = await findIdOrInsert(db, "stations", "name", station);

		const visitId = await insert(
			db,
			`INSERT INTO visits(
			date,
			duration,
			patient_count,
			visit_type_id,
			user_id,
			hospital_id,
			discipline_id,
			station_id
		) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				jsDate.getTime() / 1000,
				duration,
				patient_count,
				visit_type,
				userId,
				hospital,
				discipline,
				stationId
			]
		);
		response.redirect("/add-patient/" + visitId);
	}
];
