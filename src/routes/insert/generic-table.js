const path = require("path");
const { celebrate, Joi } = require("celebrate");

const { db } = require("../../db");
const { prepareTemplate } = require("../../ejsutils");
const {
	setupDbStructure,
	loadAll,
	insert,
	remove,
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
	path.resolve(APP_ROOT, "templates", "pages", "generic-table.ejs")
);

const tables = [
	"hospitals",
	"substances",
	"disciplines",
	"case_types",
	"visit_types",
	"intervention_problems",
	"intervention_reasons",
	"intervention_results",
	"intervention_types"
];

module.exports.get = [
	celebrate({
		params: {
			table: Joi.string().required()
		}
	}),
	async (request, response) => {
		response.header("Content-Type", "text/html");

		const { table } = request.params;

		if (tables.indexOf(table) === -1) {
			response.end("Invalid table!");
		}

		const rows = await loadAll(db, "SELECT * FROM " + table);

		response.end(
			template({
				table,
				rows
			})
		);
	}
];

module.exports.post = [
	celebrate({
		body: {
			columns: Joi.object().required()
		},
		params: {
			table: Joi.string().required()
		}
	}),
	async (request, response, next) => {
		const { table } = request.params;
		const { columns } = request.body;

		const keys = Object.keys(columns);
		const values = Object.values(columns);
		const rowCount = values[0].length;

		const rows = [];
		for (let i = 0; i < rowCount; i++) {
			const row = [];
			values.forEach(array => row.push(array[i]));
			rows.push(row);
		}

		if (tables.indexOf(table) === -1) {
			response.end("Invalid table!");
		}

		//first delete index and clear the table
		Promise.all([
			remove(db, "DELETE FROM sqlite_sequence WHERE name='" + table + "'"),
			remove(db, "DELETE FROM " + table)
		])
			.then(() => {
				return Promise.all(
					rows.map(values =>
						insert(
							db,
							`INSERT INTO ${table} (${keys.join(",")}) VALUES ('${values.join(
								"','"
							)}')`
						)
					)
				);
			})
			.then(() => {
				response.redirect("/edit/table/" + table);
			})
			.catch(e => response.end(e.toString()));
	}
];
