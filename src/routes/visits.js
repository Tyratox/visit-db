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

const template = prepareTemplate(
	path.resolve(__dirname, "..", "templates", "pages", "visits.ejs")
);

const toTimestamp = date => {
	return (
		new Date(
			date.substring(6),
			date.substring(3, 5) - 1,
			date.substring(0, 2)
		).getTime() / 1000
	);
};

module.exports.get = [
	celebrate({
		params: {
			page: Joi.number().positive()
		},
		query: {
			filter: {
				visit_type_id: Joi.number()
					.positive()
					.allow(""),
				date_from: Joi.string()
					.regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/)
					.allow(""),
				date_to: Joi.string()
					.regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/)
					.allow("")
			}
		}
	}),
	async (request, response) => {
		response.header("Content-Type", "text/html");

		const page = request.params.page ? request.params.page : 1;
		const filter = request.query.filter ? request.query.filter : {};

		const visits = await loadAll(
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
			WHERE 1=1
			${filter.visit_type_id ? "AND visits.visit_type_id = $visitTypeId" : ""}
			${filter.date_from ? "AND visits.date >= $date_from" : ""}
			${filter.date_to ? "AND visits.date <= $date_to" : ""}
			LIMIT 100
			OFFSET $offset
			`,
			{
				$offset: 100 * (page - 1),
				$visitTypeId: filter.visit_type_id ? filter.visit_type_id : undefined,
				$date_from: filter.date_from
					? toTimestamp(filter.date_from)
					: undefined,
				$date_to: filter.date_to ? toTimestamp(filter.date_to) : undefined
			}
		);

		const { count: visitCount } = await get(
			db,
			"SELECT COUNT(*) as count FROM visits"
		);

		const stations = await loadAll(db, "SELECT name FROM stations"),
			users = await loadAll(db, "SELECT username FROM users"),
			disciplines = await loadAll(
				db,
				"SELECT id, name, abbreviation FROM disciplines"
			),
			visitTypes = await loadAll(db, "SELECT id, name FROM visit_types"),
			hospitals = await loadAll(db, "SELECT id, name FROM hospitals");

		response.end(
			template({
				visits,
				page,
				visitCount,
				stations,
				users,
				disciplines,
				visitTypes,
				hospitals,
				filter
			})
		);
	}
];
