/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(6);
const path = __webpack_require__(0);

const copyFile = (source, target) => new Promise((resolve, reject) => {
	const rd = fs.createReadStream(source);

	rd.on("error", reject);

	const wr = fs.createWriteStream(target);
	wr.on("error", reject);
	wr.on("close", resolve);
	rd.pipe(wr);
});

const copyFileSync = (source, destination) => {
	fs.writeFileSync(destination, fs.readFileSync(source));
};

module.exports.setupDbStructure = root => {
	if (fs.readFileSync(path.resolve(root, "db.sqlite3"), {
		encoding: "utf-8"
	}).length === 0) {
		copyFileSync(path.resolve(__dirname, "db-empty.sqlite3"), path.resolve(root, "db.sqlite3"));
	}
};

const loadAll = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.all(query, bindParams, (err, rows) => {
			if (err) {
				return reject(err);
			}

			resolve(rows);
		});
	});
};
module.exports.loadAll = loadAll;

const insert = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, function (err) {
			if (err) {
				return reject(err);
			}
			resolve(this.lastID);
		});
	});
};
module.exports.insert = insert;

module.exports.remove = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, err => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
};

const update = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, err => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
};
module.exports.update = update;

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
module.exports.get = get;

const exists = async (db, table, column, value) => {
	return (await get(db, `SELECT * FROM ${table} WHERE ${column} = ?`, [value])) ? true : false;
};
module.exports.exists = exists;

const findIdOrInsert = async (db, table, column, value) => {
	const row = await get(db, `SELECT * FROM ${table} WHERE ${column} = ?`, [value]);

	if (row) {
		//found, return
		return Promise.resolve(row.id);
	} else {
		return new Promise((resolve, reject) => {
			db.run(`INSERT INTO ${table} (${column}) VALUES(?)`, [value], function (err) {
				if (err) {
					return reject(err);
				}
				resolve(this.lastID);
			});
		});
	}
};
module.exports.findIdOrInsert = findIdOrInsert;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const sqlite3 = __webpack_require__(9).verbose();
const path = __webpack_require__(0);

module.exports.db = new sqlite3.Database(path.resolve(process.cwd(), "db.sqlite3"));

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("celebrate");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const unixTimestampToString = timestamp => {
	return jsTimestampToString(timestamp * 1000);
};
module.exports.unixTimestampToString = unixTimestampToString;

const jsTimestampToString = timestamp => {
	const date = new Date(timestamp);
	return ("" + date.getDate()).padStart(2, 0) + "." + ("" + (date.getMonth() + 1)).padStart(2, 0) + "." + date.getFullYear();
};
module.exports.jsTimestampToString = jsTimestampToString;

const dateToJsTimestamp = date => {
	return date.getTime();
};
module.exports.dateToJsTimestamp = dateToJsTimestamp;

const dateToUnixTimestamp = date => {
	return dateToJsTimestamp(date) / 1000;
};
module.exports.dateToUnixTimestamp = dateToUnixTimestamp;

const stringToDate = string => {
	return new Date(string.substring(6), parseInt(string.substring(3, 5)) - 1, string.substring(0, 2));
};
module.exports.stringToDate = stringToDate;

const stringToUnixTimestamp = string => {
	return dateToUnixTimestamp(stringToDate(string));
};
module.exports.stringToUnixTimestamp = stringToUnixTimestamp;

const formatMinutes = minutes => {
	let days = 0,
	    hours = 0,
	    mins = minutes % 60;

	if (minutes < 60) {} else if (minutes < 60 * 24) {
		hours = Math.floor(minutes / 60);
	} else {
		days = Math.floor(minutes / 24 / 60);
		hours = Math.floor(minutes % (24 * 60) / 60);
	}

	return (days ? days + " Tag" + (days > 1 ? "e" : "") + " " : "") + (hours ? hours + " Stunde" + (hours > 1 ? "n" : "") + " " : "") + (mins ? mins + " Minute" + (mins > 1 ? "n" : "") : "");
};
module.exports.formatMinutes = formatMinutes;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const ejs = __webpack_require__(18);
const fs = __webpack_require__(6);
const path = __webpack_require__(0);

module.exports.prepareTemplate = relativePath => {
	console.log("dirname", __dirname, "rel", relativePath);
	console.log("full", path.resolve(__dirname, "templates", relativePath));
	return ejs.compile(fs.readFileSync(path.resolve(__dirname, "templates", relativePath), {
		encoding: "utf-8"
	}), {
		filename: path,
		rmWhitespace: true
	});
};

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(8);


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0);

const { setupDbStructure } = __webpack_require__(1);
setupDbStructure(process.cwd());

const db = __webpack_require__(2);
const logger = __webpack_require__(10);
const { errors: celebrateErrors } = __webpack_require__(3);

const express = __webpack_require__(12);
const expressSession = __webpack_require__(13);
const bodyParser = __webpack_require__(14);
const helmet = __webpack_require__(15);
const compression = __webpack_require__(16);

process.on("uncaughtException", err => {
	logger.log("error", err);
});

process.on("unhandledRejection", (reason, p) => {
	logger.log("error", "Unhandled Rejection at:", p, "reason:", reason);
});

const app = new express();

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession({
	secret: Math.random().toString(),
	saveUninitialized: false,
	resave: false
}));

//add routes

app.use("/static", express.static(path.resolve(__dirname, "../static")));
app.use("/bower_components", express.static(path.resolve(__dirname, "../bower_components")));

const createVisit = __webpack_require__(17);
app.get("/", createVisit.get);
app.post("/", createVisit.post);

const addPatientData = __webpack_require__(19);
app.get("/add-patient/:visitId", addPatientData.get);
app.post("/add-patient/:visitId", addPatientData.post);

const visits = __webpack_require__(20);
app.get("/visits/:page?", visits.get);

const visit = __webpack_require__(21);
app.get("/visit/:visitId", visit.get);

const deleteVisit = __webpack_require__(22);
app.get("/delete/visit/:visitId", deleteVisit);

const deletePatient = __webpack_require__(23);
app.get("/delete/patient/:patientId", deletePatient);

const exportRoute = __webpack_require__(24);
app.get("/export", exportRoute);

const overview = __webpack_require__(25);
app.get("/overview", overview.get);

app.use(celebrateErrors());
app.use((error, request, response, next) => {
	response.write("<h1>Fehler! Bitte melden!</h1>");
	response.write("<code>" + JSON.stringify(error) + "</code>");
	response.end();
});

const httpServer = app.listen(8080, "0.0.0.0", () => {
	logger.log("info", "Server running on", "http://" + httpServer.address().address + ":" + httpServer.address().port);
});

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("sqlite3");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const winston = __webpack_require__(11);
const transports = [];

transports.push(new winston.transports.Console({
	name: "console-log",
	level: "info",
	colorize: true,
	prettyPrint: true
}));
transports.push(new winston.transports.File({
	name: "file-log",
	level: "debug",
	filename: "./logs/debug.log",
	handleExceptions: true,
	colorize: false,
	prettyPrint: true
}));

const logger = new winston.Logger({
	transports,
	levels: {
		critical: 0,
		error: 1,
		warning: 2,
		info: 3,
		debug: 4
	}
});

winston.addColors({
	critical: "red",
	error: "red",
	warning: "yellow",
	info: "blue",
	debug: "magenta"
});

module.exports = logger;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("winston");

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("express-session");

/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("helmet");

/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = require("compression");

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
const { prepareTemplate } = __webpack_require__(5);
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert,
	findIdOrInsert
} = __webpack_require__(1);
const { unixTimestampToString } = __webpack_require__(4);

const template = prepareTemplate("pages/index.ejs");

module.exports.get = [celebrate({
	query: {
		visit_id: Joi.number().positive()
	}
}), async (request, response) => {
	response.header("Content-Type", "text/html");

	const { visit_id: visitIdToUpdate } = request.query;

	const stations = await loadAll(db, "SELECT name FROM stations"),
	      users = await loadAll(db, "SELECT username FROM users"),
	      disciplines = await loadAll(db, "SELECT id, name, abbreviation FROM disciplines"),
	      visitTypes = await loadAll(db, "SELECT id, name FROM visit_types"),
	      hospitals = await loadAll(db, "SELECT id, name FROM hospitals");

	let current_values = {};

	if (visitIdToUpdate) {
		current_values = await get(db, `SELECT
				users.username,
				visits.date,
				visits.patient_count,
				visits.visit_type_id as visit_type,
				visits.duration,
				visits.hospital_id as hospital,
				stations.name as station,
				visits.discipline_id as discipline
				FROM visits
				LEFT JOIN users ON visits.user_id=users.id
				LEFT JOIN stations ON visits.station_id=stations.id
				WHERE visits.id=?
				`, [visitIdToUpdate]);

		current_values.date = unixTimestampToString(current_values.date);
	}

	response.end(template(_extends({
		stations,
		users,
		visitTypes,
		hospitals,
		disciplines
	}, current_values)));
}];

module.exports.post = [celebrate({
	body: {
		username: Joi.string().alphanum().required(),
		date: Joi.string().regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/).required(),
		patient_count: Joi.number().positive().required(),
		visit_type: Joi.number().positive().required(),
		duration: Joi.number().positive().required(),
		hospital: Joi.number().positive().required(),
		station: Joi.string().alphanum().required(),
		discipline: Joi.number().positive().required()
	},
	query: {
		visit_id: Joi.number().positive()
	}
}), async (request, response, next) => {
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

	const { visit_id: visitIdToUpdate } = request.query;

	if (!(await exists(db, "disciplines", "id", discipline))) {
		return next(new Error("The received discipline id is ivalid!"));
	}

	if (!(await exists(db, "hospitals", "id", hospital))) {
		return next(new Error("The received hospital id is ivalid!"));
	}

	//Find the right user
	const userId = await findIdOrInsert(db, "users", "username", username),
	      stationId = await findIdOrInsert(db, "stations", "name", station);

	let visitId;

	if (visitIdToUpdate) {
		visitId = visitIdToUpdate;

		await update(db, `UPDATE visits
				SET date = ?,
				duration = ?,
				patient_count = ?,
				visit_type_id = ?,
				user_id = ?,
				hospital_id = ?,
				discipline_id = ?,
				station_id = ?
				WHERE visits.id=?
				`, [stringToUnixTimestamp(date), duration, patient_count, visit_type, userId, hospital, discipline, stationId, visitId]);

		response.redirect("/visit/" + visitId);
	} else {
		visitId = await insert(db, `INSERT INTO visits(
				date,
				duration,
				patient_count,
				visit_type_id,
				user_id,
				hospital_id,
				discipline_id,
				station_id
			) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, [stringToUnixTimestamp(date), duration, patient_count, visit_type, userId, hospital, discipline, stationId]);

		response.redirect("/add-patient/" + visitId);
	}
}];

/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports = require("ejs");

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
const { prepareTemplate } = __webpack_require__(5);
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert,
	findIdOrInsert,
	remove
} = __webpack_require__(1);

const {
	stringToUnixTimestamp,
	unixTimestampToString
} = __webpack_require__(4);

const template = prepareTemplate("pages/patient.ejs");

module.exports.get = [celebrate({
	query: {
		patient_id: Joi.number().positive()
	}
}), async (request, response) => {
	response.header("Content-Type", "text/html");

	const { visitId } = request.params;
	const { patient_id: patientId } = request.query;

	const substances = await loadAll(db, "SELECT id, atc_code, name FROM substances"),
	      caseTypes = await loadAll(db, "SELECT id, abbreviation, name FROM case_types"),
	      visit = await get(db, `SELECT date,
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
				WHERE visits.id = ?`, [visitId]);
	let patient = {};

	if (patientId) {
		patient = await get(db, `
				SELECT
				cases.case_number,
				cases.case_type_id as case_type,
				patients.patient_number,
				patients.substance_id as substance,
				patients.gender,
				patients.date_of_birth,
				patients.visit_id
				FROM patients
				LEFT JOIN cases ON patients.case_id=cases.id
				WHERE patients.id = ?`, [patientId]);
		patient.fields = await loadAll(db, `
				SELECT
				patient_fields.title,
				patient_fields.content
				FROM patient_fields
				WHERE patient_fields.patient_id = ?`, [patientId]);
		patient.date_of_birth = unixTimestampToString(patient.date_of_birth);
	}

	response.end(template(_extends({
		visit: _extends({}, visit, { date: unixTimestampToString(visit.date) }),
		substances,
		caseTypes
	}, patient)));
}];

module.exports.post = [celebrate({
	body: {
		case_number: Joi.string().required(),
		date_of_birth: Joi.string().regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/).required(),
		case_type: Joi.number().positive().required(),
		patient_number: Joi.string().allow(""),
		gender: Joi.string().valid("male", "female").required(),
		substance: Joi.number().positive().allow(""),
		field_title: Joi.array().items(Joi.string().max(25).allow("")),
		field_content: Joi.array().items(Joi.string().max(500).allow(""))
	},
	query: {
		patient_id: Joi.number().positive()
	}
}), async (request, response) => {
	const { visitId } = request.params;
	const {
		case_number,
		date_of_birth,
		case_type,
		patient_number,
		gender,
		substance,
		field_title,
		field_content
	} = request.body;

	const { patient_id: idToUpdate } = request.query;

	if (substance && !(await exists(db, "substances", "id", substance))) {
		return next(new Error("The received substance id is invalid!"));
	}

	if (!(await exists(db, "case_types", "id", case_type))) {
		return next(new Error("The received case_type id is invalid!"));
	}

	if (field_title.length !== field_content.length) {
		return next(new Error("The field title/content lengths don't match!"));
	}

	const caseId = await findIdOrInsert(db, "cases", "case_number", case_number);

	let patientId;

	if (idToUpdate) {
		patientId = idToUpdate;

		await update(db, `
				UPDATE patients
				SET case_id = ?,
				patient_number = ?,
				substance_id = ?,
				gender = ?,
				date_of_birth = ?
			`, [caseId, patient_number, substance ? substance : null, gender, stringToUnixTimestamp(date_of_birth)]);
	} else {
		patientId = await insert(db, "INSERT INTO patients(case_id, patient_number, substance_id, gender, date_of_birth, visit_id) VALUES(?, ?, ?, ?, ?, ?)", [caseId, patient_number, substance ? substance : null, gender, stringToUnixTimestamp(date_of_birth), visitId]);
	}

	update(db, "UPDATE cases SET case_type_id = ?", [case_type]).then(() => {
		return Promise.all(field_title.map((title, index) => {
			if (!title || !field_content[index]) {
				return Promise.resolve();
			}

			return remove(db, "DELETE FROM patient_fields WHERE patient_id = ?", [patientId]).then(() => {
				return insert(db, "INSERT INTO patient_fields (title, content, patient_id) VALUES (?, ?, ?)", [title, field_content[index], patientId]);
			});
		}));
	}).then(() => {
		response.redirect("/visit/" + visitId);
	});
}];

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
const { prepareTemplate } = __webpack_require__(5);
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert
} = __webpack_require__(1);

const {
	stringToUnixTimestamp,
	unixTimestampToString
} = __webpack_require__(4);

const template = prepareTemplate("pages/visits.ejs");

module.exports.get = [celebrate({
	params: {
		page: Joi.number().positive()
	},
	query: {
		filter: {
			visit_type_id: Joi.number().positive().allow(""),
			date_from: Joi.string().regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/).allow(""),
			date_to: Joi.string().regex(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/).allow(""),
			user_id: Joi.number().positive().allow(""),
			hospital_id: Joi.number().positive().allow(""),
			discipline_id: Joi.number().positive().allow(""),
			station_id: Joi.number().positive().allow("")
		}
	}
}), async (request, response) => {
	response.header("Content-Type", "text/html");

	const page = request.params.page ? request.params.page : 1;
	const filter = request.query.filter ? request.query.filter : {};

	const visits = (await loadAll(db, `SELECT
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
			`, {
		$offset: 100 * (page - 1),
		$visitTypeId: filter.visit_type_id ? filter.visit_type_id : undefined,
		$dateFrom: filter.date_from ? stringToUnixTimestamp(filter.date_from) : undefined,
		$dateTo: filter.date_to ? stringToUnixTimestamp(filter.date_to) : undefined,
		$userId: filter.user_id ? filter.user_id : undefined,
		$hospitalId: filter.hospital_id ? filter.hospital_id : undefined,
		$disciplineId: filter.discipline_id ? filter.discipline_id : undefined,
		$stationId: filter.station_id ? filter.station_id : undefined
	})).map(visit => {
		return _extends({}, visit, { date: unixTimestampToString(visit.date) });
	});

	const { count: visitCount } = await get(db, "SELECT COUNT(*) as count FROM visits");

	const stations = await loadAll(db, "SELECT id, name FROM stations"),
	      users = await loadAll(db, "SELECT id, username FROM users"),
	      disciplines = await loadAll(db, "SELECT id, name, abbreviation FROM disciplines"),
	      visitTypes = await loadAll(db, "SELECT id, name FROM visit_types"),
	      hospitals = await loadAll(db, "SELECT id, name, abbreviation FROM hospitals");

	response.end(template({
		visits,
		page,
		visitCount,
		stations,
		users,
		disciplines,
		visitTypes,
		hospitals,
		filter
	}));
}];

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
const { prepareTemplate } = __webpack_require__(5);
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert
} = __webpack_require__(1);

const { unixTimestampToString } = __webpack_require__(4);

const template = prepareTemplate("pages/visit.ejs");

module.exports.get = [celebrate({
	params: {
		visitId: Joi.number().positive()
	}
}), async (request, response) => {
	response.header("Content-Type", "text/html");

	const { visitId } = request.params;

	let visit = await get(db, `SELECT
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
			WHERE visits.id = ?
			`, [visitId]);

	visit.date = unixTimestampToString(visit.date);

	const patients = await Promise.all((await loadAll(db, `SELECT
				patients.id,
				patients.patient_number,
				patients.date_of_birth,
				patients.gender,
				cases.case_number,
				case_types.abbreviation as case_type_abbreviation,
				case_types.name as case_type_name,
				substances.atc_code,
				substances.name as substance_name,
				case_types.abbreviation as case_type_abbreviation,
				case_types.name as case_type_name
				FROM patients
				LEFT JOIN cases ON patients.case_id=cases.id
				LEFT JOIN case_types ON cases.case_type_id=case_types.id
				LEFT JOIN substances ON patients.substance_id=substances.id
				WHERE patients.visit_id = ?
			`, [visitId])).map(patient => {
		return loadAll(db, `SELECT title, content FROM
				patient_fields
				WHERE patient_id = ?
				`, [patient.id]).then(fields => {
			return Promise.resolve(_extends({}, patient, {
				date_of_birth: unixTimestampToString(patient.date_of_birth),
				fields
			}));
		});
	}));

	response.end(template({ visit, patients }));
}];

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
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
} = __webpack_require__(1);

module.exports = [celebrate({
	params: {
		visitId: Joi.number().positive()
	}
}), (request, response) => {
	remove(db, "DELETE FROM visits WHERE id=?", [request.params.visitId]).then(() => {
		response.redirect("/visits");
	});
}];

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
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
} = __webpack_require__(1);

module.exports = [celebrate({
	params: {
		patientId: Joi.number().positive()
	}
}), async (request, response) => {
	const { visit_id: visitId } = await get(db, "SELECT visit_id FROM patients WHERE id=?", [request.params.patientId]);
	remove(db, "DELETE FROM patients WHERE id=?", [request.params.patientId]).then(() => {
		return remove(db, "DELETE FROM patient_fields WHERE patient_id=?", [request.params.patientId]);
	}).then(() => {
		response.redirect("/visit/" + visitId);
	});
}];

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert
} = __webpack_require__(1);

const { unixTimestampToString } = __webpack_require__(4);

module.exports = [celebrate({
	query: {
		visit_type_id: Joi.number().positive().allow("")
	}
}), async (request, response) => {
	const { visit_type_id: visitTypeId } = request.query;

	const rows = (await loadAll(db, `SELECT
			patients.id,
			patients.patient_number,
			patients.date_of_birth,
			patients.gender,
			cases.case_number,
			substances.atc_code,
			substances.name as substance_name,
			case_types.abbreviation as case_type_abbreviation,
			case_types.name as case_type_name,
			visits.date as date,
			visits.duration as duration,
			visits.patient_count as patient_count,
			visit_types.name as visit_type_name,
			users.username as username,
			hospitals.name as hospital_name,
			hospitals.abbreviation as hospital_abbreviation,
			disciplines.name as discipline_name,
			stations.name as station_name
			FROM patients
			LEFT JOIN cases ON patients.case_id=cases.id
			LEFT JOIN case_types ON cases.case_type_id=case_types.id
			LEFT JOIN substances ON patients.substance_id=substances.id
			LEFT JOIN visits ON patients.visit_id=visits.id
			LEFT JOIN visit_types ON visits.visit_type_id=visit_types.id
			LEFT JOIN users ON visits.user_id=users.id
			LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
			LEFT JOIN disciplines ON visits.discipline_id=disciplines.id
			LEFT JOIN stations ON visits.station_id=stations.id
			WHERE 1=1
			${visitTypeId ? "AND visits.visit_type_id = $visitTypeId" : ""}
			`, {
		$visitTypeId: visitTypeId ? visitTypeId : undefined
	})).map(row => {
		return '"' + [unixTimestampToString(row.date), row.duration, row.patient_count, row.username, row.hospital_abbreviation, row.hospital_name, row.discipline_name, row.station_name, row.patient_number, row.date_of_birth, row.gender, row.substance_name, row.atc_code, row.case_number, row.case_type_abbreviation, row.case_type_name].join('","') + '"';
	});

	response.setHeader("Content-type", "application/octet-stream");
	response.setHeader("Content-Disposition", "attachment; filename=export.csv");
	response.send('"' + ["Datum", "Dauer (in Minuten)", "Anzahl Patienten", "Pharm.", "Spital (Abkürzung)", "Spital", "Disziplin", "Station", "Patientennummer", "Geburtsdatum", "Geschlecht", "Wirkstoff", "ATC", "Fallnummer", "Falltyp (Abkürzung)", "Falltyp"].join('","') + '"' + "\n" + rows.join("\n"));
}];

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const path = __webpack_require__(0);
const { celebrate, Joi } = __webpack_require__(3);

const { db } = __webpack_require__(2);
const { prepareTemplate } = __webpack_require__(5);
const {
	setupDbStructure,
	loadAll,
	insert,
	update,
	get,
	exists,
	findOrInsert
} = __webpack_require__(1);

const { unixTimestampToString, formatMinutes } = __webpack_require__(4);

const template = prepareTemplate("pages/overview.ejs");

module.exports.get = async (request, response) => {
	response.header("Content-Type", "text/html");

	const visitsPerPerson = (await loadAll(db, `SELECT
		users.id as user_id,
		users.username as name,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		patients.correction_count
		FROM visits
		LEFT JOIN users ON visits.user_id=users.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM patients
			GROUP BY patients.visit_id
		) as patients ON visits.id=patients.visit_id
		GROUP BY visits.user_id
		ORDER BY duration ASC
		`)).map(row => {
		return _extends({}, row, { duration: formatMinutes(row.duration) });
	});

	const visitsPerHospital = (await loadAll(db, `SELECT
		hospitals.id as hospital_id,
		hospitals.name as name,
		hospitals.abbreviation as abbreviation,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		patients.correction_count
		FROM visits
		LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM patients
			GROUP BY patients.visit_id
		) as patients ON visits.id=patients.visit_id
		GROUP BY visits.hospital_id
		ORDER BY correction_count DESC
		`)).map(row => {
		return _extends({}, row, { duration: formatMinutes(row.duration) });
	});

	const visitsPerStation = (await loadAll(db, `SELECT
		stations.id as station_id,
		stations.name as name,
		hospitals.abbreviation as hospital_abbreviation,
		COUNT(visits.id) as count,
		SUM(visits.duration) as duration,
		SUM(patient_count) as patient_count,
		patients.correction_count
		FROM visits
		LEFT JOIN stations ON visits.station_id=stations.id
		LEFT JOIN hospitals ON visits.hospital_id=hospitals.id
		LEFT JOIN(
			SELECT
			patients.visit_id as visit_id,
			COUNT(*) as correction_count
			FROM patients
			GROUP BY patients.visit_id
		) as patients ON visits.id=patients.visit_id
		GROUP BY visits.station_id
		ORDER BY correction_count DESC
		`)).map(row => {
		return _extends({}, row, { duration: formatMinutes(row.duration) });
	});

	response.end(template({
		visitsPerPerson,
		visitsPerHospital,
		visitsPerStation
	}));
};

/***/ })
/******/ ]);
//# sourceMappingURL=compiled.js.map