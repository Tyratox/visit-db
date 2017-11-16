const path = require("path");

const db = require("./db");
const logger = require("./logger");
const { errors: celebrateErrors } = require("celebrate");

const express = require("express");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");

const { setupDbStructure } = require("./dbutils");

process.on("uncaughtException", err => {
	logger.log("error", err);
});

process.on("unhandledRejection", (reason, p) => {
	logger.log("error", "Unhandled Rejection at:", p, "reason:", reason);
});

const app = new express();

setupDbStructure(db, __dirname);

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

//add routes

app.use("/static", express.static(path.resolve(__dirname, "../static")));
app.use(
	"/bower_components",
	express.static(path.resolve(__dirname, "../bower_components"))
);

const createVisit = require("./routes/insert/create-visit");
app.get("/", createVisit.get);
app.post("/", createVisit.post);

const addPatientData = require("./routes/insert/add-patient-data");
app.get("/add-patient/:visitId", addPatientData.get);
app.post("/add-patient/:visitId", addPatientData.post);

const visits = require("./routes/visits");
app.get("/visits/:page?", visits.get);

const visit = require("./routes/visit");
app.get("/visit/:visitId", visit.get);

const exportRoute = require("./routes/export");
app.get("/export", exportRoute);

app.use(celebrateErrors());
app.use((error, request, response, next) => {
	response.write("<h1>Fehler! Bitte melden!</h1>");
	response.write("<code>" + JSON.stringify(error) + "</code>");
	response.end();
});

const httpServer = app.listen(8080, "0.0.0.0", () => {
	logger.log(
		"info",
		"Server running on",
		"http://" + httpServer.address().address + ":" + httpServer.address().port
	);
});
