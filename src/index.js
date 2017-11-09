const fs = require("fs");
const path = require("path");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db.sqlite3");
const logger = require("./logger");
const ejs = require("ejs");

const express = require("express");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");
const { celebrate, Joi, errors: celebrateErrors } = require("celebrate");

process.on("uncaughtException", err => {
	logger.log("error", err);
});

process.on("unhandledRejection", (reason, p) => {
	logger.log("error", "Unhandled Rejection at:", p, "reason:", reason);
});

const app = new express();

if (fs.readFileSync("./db.sqlite3", { encoding: "utf-8" }).length === 0) {
	db.serialize(() => {
		const tables = fs.readdirSync(
			path.resolve(__dirname, "..", "database", "structure")
		);
		tables.forEach(fileName => {
			db.run(
				fs.readFileSync(
					path.resolve(__dirname, "..", "database", "structure", fileName),
					{ encoding: "utf-8" }
				)
			);
		});

		fs
			.readFileSync(
				path.resolve(__dirname, "..", "database", "indicies.sqlite3.sql"),
				{ encoding: "utf-8" }
			)
			.split("\n")
			.forEach(index => {
				db.run(index);
			});
	});
}

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	expressSession({
		secret: Math.random().toString(),
		saveUninitialized: false,
		resave: false
	})
);

const prepareTemplate = path => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, { encoding: "utf-8" }, (err, data) => {
			if (err) {
				reject(err);
			}

			resolve(ejs.compile(data, { filename: path, rmWhitespace: true }));
		});
	});
};

const loadAll = (db, query) => {
	return new Promise((resolve, reject) => {
		db.all(query, (err, rows) => {
			if (err) {
				return reject(err);
			}

			resolve(rows);
		});
	});
};

const insert = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, function(err) {
			if (err) {
				return reject(err);
			}
			resolve(this.lastID);
		});
	});
};

const get = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.get(query, bindParams, (err, row) => {
			if (err) {
				return reject(err);
			}
			resolve(row);
		});
	});
};

const findIdOrInsert = async (db, table, column, value) => {
	const row = await get(db, `SELECT * FROM ${table} WHERE ${column} = ?`, [
		value
	]);

	if (row) {
		//found, return
		return Promise.resolve(row.id);
	} else {
		return new Promise((resolve, reject) => {
			db.run(`INSERT INTO ${table} (${column}) VALUES(?)`, [value], function(
				err
			) {
				if (err) {
					return reject(err);
				}
				resolve(this.lastID);
			});
		});
	}
};

app.use("/static", express.static(path.resolve(__dirname, "../static")));
app.use(
	"/bower_components",
	express.static(path.resolve(__dirname, "../bower_components"))
);

const setupRouting = async () => {
	app.get("/", async (request, response) => {
		response.header("Content-Type", "text/html");

		const indexTemplate = await prepareTemplate(
			path.resolve(__dirname, "templates", "pages", "index.ejs")
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
			indexTemplate({ stations, users, visitTypes, hospitals, disciplines })
		);
	});

	app.post(
		"/",
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
		async (request, response) => {
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

			//Find the right user
			const userId = await findIdOrInsert(db, "users", "username", username),
				days = date.substring(0, 2),
				months = date.substring(3, 5),
				year = date.substring(6),
				jsDate = new Date(year + "-" + months + "-" + days),
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
			response.redirect("/step2/" + visitId);
		}
	);

	app.get("/step2/:visitId", async (request, response) => {
		response.header("Content-Type", "text/html");

		const visitId = request.params.visitId;

		const indexTemplate = await prepareTemplate(
			path.resolve(__dirname, "templates", "pages", "step2.ejs")
		);

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

		response.end(indexTemplate({ visit, substances, caseTypes }));
	});

	app.use(celebrateErrors());
	app.use((error, request, response, next) => {
		response.write("<h1>Fehler! Bitte melden!</h1>");
		response.write("<code>" + JSON.stringify(error) + "</code>");
		response.end();
	});
};

setupRouting().then(() => {
	const httpServer = app.listen(8080, "0.0.0.0", () => {
		logger.log(
			"info",
			"Server running on",
			"http://" + httpServer.address().address + ":" + httpServer.address().port
		);
	});
});
