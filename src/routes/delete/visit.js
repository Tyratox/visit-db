const path = require("path");
const { celebrate, Joi } = require("celebrate");

const { db } = require("../../db");
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	remove,
	exists,
	findOrInsert,
	findIdOrInsert
} = require("../../dbutils");

module.exports = [
	celebrate({
		params: {
			visitId: Joi.number().positive()
		}
	}),
	(request, response) => {
		remove(db, "DELETE FROM visits WHERE id=?", [
			request.params.visitId
		]).then(() => {
			response.redirect("/visits");
		});
	}
];
