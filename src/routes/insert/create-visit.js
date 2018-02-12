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
const {
	unixTimestampToString,
	stringToUnixTimestamp
} = require("../../dateutils");

const template = prepareTemplate(
	path.resolve(APP_ROOT, "templates", "pages", "index.ejs")
);

module.exports.get = [
	celebrate({
		query: {
			visit_id: Joi.number().positive()
		}
	}),
	async (request, response) => {
		const { visit_id: visitIdToUpdate } = request.query;

		const stations = await loadAll(db, "SELECT name FROM stations"),
			users = await loadAll(db, "SELECT username FROM users"),
			disciplines = await loadAll(
				db,
				"SELECT id, name, abbreviation FROM disciplines"
			),
			visitTypes = await loadAll(db, "SELECT id, name FROM visit_types"),
			hospitals = await loadAll(db, "SELECT id, name FROM hospitals");

		let current_values = {};

		if (visitIdToUpdate) {
			current_values = await get(
				db,
				`SELECT
				users.username,
				company.username as company_username,
				visits.date,
				visits.patient_count,
				visits.visit_type_id as visitType,
				visits.duration,
				visits.hospital_id as hospital,
				stations.name as station,
				visits.discipline_id as discipline
				FROM visits
				LEFT JOIN users ON visits.user_id=users.id
				LEFT JOIN users as company ON visits.company_user_id=company.id
				LEFT JOIN stations ON visits.station_id=stations.id
				WHERE visits.id=?
				`,
				[visitIdToUpdate]
			);

			current_values.date = unixTimestampToString(current_values.date);
		}

		response.end(
			template({
				stations,
				users,
				visitTypes,
				hospitals,
				disciplines,
				...current_values
			})
		);
	}
];

module.exports.post = [
	celebrate({
		body: {
			username: Joi.string()
				.alphanum()
				.required(),
			company_username: Joi.string()
				.alphanum()
				.allow("")
				.required(),
			date: Joi.string()
				.regex(/[0-9]{1,2}\.[0-9]{1,2}\.([0-9]{4}|[0-9]{2})/)
				.required(),
			patient_count: Joi.number()
				.positive()
				.required(),
			visit_type: Joi.number()
				.positive()
				.required(),
			preparation_duration: Joi.number()
				.positive()
				.allow(0)
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
		},
		query: {
			visit_id: Joi.number().positive()
		}
	}),
	async (request, response, next) => {
		let {
			username,
			company_username,
			date,
			patient_count,
			visit_type,
			preparation_duration,
			duration,
			hospital,
			station,
			discipline
		} = request.body;

		const { visit_id: visitIdToUpdate } = request.query;

		if (!await exists(db, "disciplines", "id", discipline)) {
			return next(new Error("The received discipline id is ivalid!"));
		}

		if (!await exists(db, "hospitals", "id", hospital)) {
			return next(new Error("The received hospital id is ivalid!"));
		}

		//Find the right user
		const userId = await findIdOrInsert(db, "users", "username", username),
			companyUserId =
				company_username !== ""
					? await findIdOrInsert(db, "users", "username", company_username)
					: null,
			stationId = await findIdOrInsert(db, "stations", "name", station);

		let visitId;

		if (visitIdToUpdate) {
			visitId = visitIdToUpdate;

			await update(
				db,
				`UPDATE visits
				SET date = ?,
				preparation_duration = ?,
				duration = ?,
				patient_count = ?,
				visit_type_id = ?,
				user_id = ?,
				company_user_id = ?,
				hospital_id = ?,
				discipline_id = ?,
				station_id = ?
				WHERE visits.id = ?
				`,
				[
					stringToUnixTimestamp(date),
					preparation_duration,
					duration,
					patient_count,
					visit_type,
					userId,
					companyUserId,
					hospital,
					discipline,
					stationId,
					visitId
				]
			);

			response.redirect("/visit/" + visitId);
		} else {
			visitId = await insert(
				db,
				`INSERT INTO visits(
				date,
				preparation_duration,
				duration,
				patient_count,
				visit_type_id,
				user_id,
				company_user_id,
				hospital_id,
				discipline_id,
				station_id
			) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					stringToUnixTimestamp(date),
					preparation_duration,
					duration,
					patient_count,
					visit_type,
					userId,
					companyUserId,
					hospital,
					discipline,
					stationId
				]
			);

			response.redirect("/add-patient/" + visitId);
		}
	}
];
