const path = require("path");
const logger = require("./logger");
const fs = require("fs");
const opn = require("opn");
const ips = require("./ips");
const request = require("sync-request"); //only when bootstrapping app
const PORT = 8080;

//first we have to check whether there's already a server running

try {
	const ips = fs
		.readFileSync(path.resolve(process.cwd(), ".ip"), {
			encoding: "utf-8"
		})
		.split(",");

	logger.log("info", ".ip exists, checking content...");

	ips.forEach(ip => {
		//check if the server's still running
		logger.log("info", "checking " + ip + " ...");
		try {
			const response = request("GET", "http://" + ip + ":" + PORT + "/ping", {
				timeout: 1000,
				retry: true,
				retryDelay: 50,
				maxRetries: 1
			})
				.getBody()
				.toString();

			logger.log("info", "response: " + response);

			if (response === "pong") {
				logger.log("info", "opening browser");
				opn("http://" + ip + ":" + PORT);
				logger.log("info", "waiting 2000ms to quit..");
				let waitTill = new Date(new Date().getTime() + 2000);

				while (waitTill > new Date()) { }
				process.exit();
			}
		} catch (err) {
			logger.log("info", "not running on " + ip);
			//not online, continue with execution
		}
	});
} catch (err) {
	//the file doesn't exist, continue with starting the server
}

const { setupDbStructure } = require("./dbutils");
setupDbStructure(process.cwd());

const db = require("./db");
const { errors: celebrateErrors } = require("celebrate");

global.APP_ROOT = path.resolve(__dirname, "..");

const express = require("express");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");

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
app.use(
	bodyParser.urlencoded({ extended: true, limit: "10mb", parameterLimit: 10e5 })
);
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

app.use((request, response, next) => {
	response.header("Content-Type", "text/html");
	next();
});

const createVisit = require("./routes/insert/create-visit");
app.get("/", createVisit.get);
app.post("/", createVisit.post);

const addPatientData = require("./routes/insert/add-patient-data");
app.get("/add-patient/:visitId", addPatientData.get);
app.post("/add-patient/:visitId", addPatientData.post);

const table = require("./routes/insert/generic-table");
app.get("/edit/table/:table", table.get);
app.post("/edit/table/:table", table.post);

const visits = require("./routes/visits");
app.get("/visits/:page?", visits.get);

const visit = require("./routes/visit");
app.get("/visit/:visitId", visit.get);

const deleteVisit = require("./routes/delete/visit");
app.get("/delete/visit/:visitId", deleteVisit);

const deletePatient = require("./routes/delete/patient");
app.get("/delete/patient/:patientId", deletePatient);

const exportRoute = require("./routes/export");
app.get("/export", exportRoute);

const overview = require("./routes/overview");
app.get("/overview", overview.get);

const reset = require("./routes/delete/reset");
app.get("/reset", reset);

app.get("/ping", (request, response, next) => response.end("pong"));

app.use(celebrateErrors());
app.use((error, request, response, next) => {
	response.header("Content-Type", "text/html");

	response.write("<h1>Fehler!</h1>");
	response.write("<code>" + error.toString() + "</code>");
	response.end();
});

//write local ip to file
fs.writeFileSync(path.resolve(process.cwd(), ".ip"), ips.join(","));

const httpServer = app.listen(PORT, "0.0.0.0", () => {
	logger.log(
		"info",
		"Server running on",
		"http://" + httpServer.address().address + ":" + httpServer.address().port
	);
	opn("http://localhost" + ":" + httpServer.address().port);
});
