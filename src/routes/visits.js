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

module.exports.get = [
	celebrate({
		params: {
			page: Joi.number().positive()
		}
	}),
	async (request, response) => {
		response.header("Content-Type", "text/html");

		const page = request.params.page ? request.params.page : 1;

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
			LIMIT 100
			OFFSET ${100 * (page - 1)}
			`
		);

		const { count: visitCount } = await get(
			db,
			"SELECT COUNT(*) as count FROM visits"
		);

		response.end(template({ visits, page, visitCount }));
	}
];
