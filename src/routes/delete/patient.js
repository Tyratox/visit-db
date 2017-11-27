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
			patientId: Joi.number().positive()
		}
	}),
	async (request, response) => {
		const { visit_id: visitId } = await get(
			db,
			"SELECT visit_id FROM patients WHERE id=?",
			[request.params.patientId]
		);
		remove(db, "DELETE FROM patients WHERE id=?", [request.params.patientId])
			.then(() => {
				return remove(db, "DELETE FROM interventions WHERE patient_id=?", [
					request.params.patientId
				]);
			})
			.then(() => {
				response.redirect("/visit/" + visitId);
			});
	}
];
