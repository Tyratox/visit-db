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

const {
	stringToUnixTimestamp,
	unixTimestampToString
} = require("../dateutils");

const template = prepareTemplate(
	path.resolve(APP_ROOT, "templates", "pages", "visits.ejs")
);

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
					.allow(""),
				user_id: Joi.number()
					.positive()
					.allow(""),
				hospital_id: Joi.number()
					.positive()
					.allow(""),
				discipline_id: Joi.number()
					.positive()
					.allow(""),
				station_id: Joi.number()
					.positive()
					.allow("")
			}
		}
	}),
	async (request, response) => {
		const page = request.params.page ? request.params.page : 1;
		const filter = request.query.filter ? request.query.filter : {};

		const visits = (await loadAll(
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
			${filter.date_from ? "AND visits.date >= $dateFrom" : ""}
			${filter.date_to ? "AND visits.date <= $dateTo" : ""}
			${filter.user_id ? "AND users.id = $userId" : ""}
			${filter.hospital_id ? "AND hospitals.id = $hospitalId" : ""}
			${filter.discipline_id ? "AND disciplines.id = $disciplineId" : ""}
			${filter.station_id ? "AND stations.id = $stationId" : ""}
			ORDER BY visits.date DESC
			LIMIT 100
			OFFSET $offset
			`,
			{
				$offset: 100 * (page - 1),
				$visitTypeId: filter.visit_type_id ? filter.visit_type_id : undefined,
				$dateFrom: filter.date_from
					? stringToUnixTimestamp(filter.date_from)
					: undefined,
				$dateTo: filter.date_to
					? stringToUnixTimestamp(filter.date_to)
					: undefined,
				$userId: filter.user_id ? filter.user_id : undefined,
				$hospitalId: filter.hospital_id ? filter.hospital_id : undefined,
				$disciplineId: filter.discipline_id ? filter.discipline_id : undefined,
				$stationId: filter.station_id ? filter.station_id : undefined
			}
		)).map(visit => {
			return { ...visit, date: unixTimestampToString(visit.date) };
		});

		const { count: visitCount } = await get(
			db,
			"SELECT COUNT(*) as count FROM visits"
		);

		const stations = await loadAll(db, "SELECT id, name FROM stations"),
			users = await loadAll(db, "SELECT id, username FROM users"),
			disciplines = await loadAll(
				db,
				"SELECT id, name, abbreviation FROM disciplines"
			),
			visitTypes = await loadAll(db, "SELECT id, name FROM visit_types"),
			hospitals = await loadAll(
				db,
				"SELECT id, name, abbreviation FROM hospitals"
			);

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
