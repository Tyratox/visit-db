const path = require("path");

const { db } = require("../../db");
const { remove } = require("../../dbutils");

const exportRoute = require("../export")[1]; //[0] is the validation

const tables = [
	"cases",
	"interventions",
	"patients",
	"stations",
	"users",
	"visits"
];

const resetRoute = async () => {
	return Promise.all([
		...tables.map(table => remove(db, "DELETE FROM " + table)),
		remove(
			db,
			"DELETE FROM sqlite_sequence WHERE " +
				tables.map(table => `name='${table}'`).join(" OR ")
		)
	]);
};

module.exports = async (request, response) => {
	await exportRoute(request, response);
	//response was already sent, now we can reset
	return resetRoute();
};
